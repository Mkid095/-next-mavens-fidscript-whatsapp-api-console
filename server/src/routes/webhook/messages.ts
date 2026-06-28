import type { Request, Response } from 'express';
import db from '../../database.js';
import { emitInstanceStateChange, emitNewMessage } from '../../utils/gateway.js';
import { parseIncomingMessage } from '../../utils/messageParser.js';
import { logAuditAction } from '../../utils/audit.js';
import { emitDashboardRefresh } from '../../utils/dashboardEmitter.js';
import { resolveConversation } from '../../modules/customers/index.js';
import { dispatchMessageReceived } from '../../modules/platform/events/index.js';
import { warmGroupCache } from '../../services/whatsapp/groupMetadata.js';
import { buildWsCtx, chatIdFromJid, type WebhookInstance } from './shared.js';

// messages.upsert — inbound message: resolve customer/conversation, persist, emit.
export async function handleMessagesUpsert(
  instance: WebhookInstance,
  data: Record<string, unknown> | undefined,
  sender: string | undefined,
  rawBody: unknown,
  req: Request,
  res: Response,
): Promise<void> {
  const key = data?.key as { remoteJid?: string; fromMe?: boolean; id?: string } | undefined;
  if (!key || key.fromMe) { res.status(200).json({ success: true, handled: true }); return; }

  const senderJid = sender || key.remoteJid;
  const remoteJid = key.remoteJid || '';
  const { chatId, isGroup, phone } = chatIdFromJid(remoteJid);
  const msgId = key.id || `msg_${Date.now()}`;
  const pushName = data?.pushName as string | undefined;
  const parsed = parseIncomingMessage(data ?? {});
  const timestamp = new Date().toISOString();

  const ctx = buildWsCtx(instance);
  let customerId = '';
  let conversationId = '';
  try {
    const resolved = await resolveConversation(ctx, 'whatsapp', chatId, String(instance.id), null, pushName);
    customerId = resolved.customerId;
    conversationId = resolved.conversationId;
  } catch (err) { console.error('[WEBHOOK] resolveConversation failed:', err); }

  try {
    db.prepare(`
      INSERT OR IGNORE INTO inbox_messages
        (id, instance_id, client_id, from_number, from_name, message_type, content,
         media_url, is_read, direction, extra, raw_payload, chat_id, is_group,
         conversation_id, customer_id, workspace_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'incoming', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      msgId, instance.id, instance.client_id, phone || senderJid || '', pushName || '',
      parsed.messageType, parsed.content, parsed.mediaUrl,
      JSON.stringify(parsed.extra), JSON.stringify(rawBody),
      chatId, isGroup ? 1 : 0, conversationId || null, customerId || null, ctx.workspaceId,
    );
    db.prepare('UPDATE instances SET last_active = ? WHERE id = ?').run(timestamp, instance.id);
    db.prepare('UPDATE clients SET last_active = ? WHERE id = ?').run(timestamp, instance.client_id);
  } catch { /* duplicate message id */ }

  if (customerId && conversationId) {
    dispatchMessageReceived(ctx, {
      conversationId, customerId, channel: 'whatsapp', messageId: msgId,
      messageType: parsed.messageType, content: parsed.content, mediaUrl: parsed.mediaUrl,
      fromNumber: phone || senderJid || '', fromName: pushName || null,
    }).catch(err => console.error('[WEBHOOK] dispatchMessageReceived failed:', err));
  }

  autoProvisionContact(instance, phone, pushName, req);

  // Eagerly warm group-metadata cache so the inbox can show the group subject
  // immediately instead of raw JID on the first arrival.
  if (isGroup) { warmGroupCache(chatId).catch(() => { /* best-effort */ }); }
  emitNewMessage(instance.name, {
    id: msgId, from_number: phone || senderJid || '', from_name: pushName || '',
    message_type: parsed.messageType, content: parsed.content, media_url: parsed.mediaUrl,
    timestamp, chat_id: chatId, is_group: isGroup ? 1 : 0,
  });
  emitInstanceStateChange(instance.name, 'connected', phone || null);
  emitDashboardRefresh(instance.client_id);
  res.status(200).json({ success: true, handled: true });
}

// Auto-provision: any new number that texts in becomes a contact (deduped).
// Stores pushName in whatsapp_name (null if not set); preserves any manual CRM name.
function autoProvisionContact(instance: WebhookInstance, phone: string | null, pushName: string | undefined, req: Request): void {
  if (!phone) return;
  const existing = db.prepare('SELECT id, name, whatsapp_name FROM contacts WHERE client_id = ? AND phone = ?')
    .get(instance.client_id, phone) as { id: string; name: string | null; whatsapp_name: string | null } | undefined;
  if (!existing) {
    // Store null if pushName is undefined/empty — empty string would be treated as a name
    const waName = pushName && pushName.trim() ? pushName.trim() : null;
    db.prepare('INSERT INTO contacts (id, client_id, phone, whatsapp_name, tags) VALUES (?, ?, ?, ?, ?)')
      .run(`auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, instance.client_id, phone, waName, 'auto');
  } else if (pushName && pushName.trim() && !existing.whatsapp_name) {
    // Only set whatsapp_name if not already set — preserve what we have
    db.prepare('UPDATE contacts SET whatsapp_name = ? WHERE id = ?').run(pushName.trim(), existing.id);
  }
  const current = db.prepare('SELECT phone_number FROM instances WHERE name = ?').get(instance.name) as { phone_number: string | null } | undefined;
  if (!current?.phone_number) {
    db.prepare('UPDATE instances SET phone_number = ? WHERE name = ?').run(phone, instance.name);
    logAuditAction(req, 'MESSAGE_RECEIVED', 'instance', String(instance.id), `Phone captured from message: ${phone}`);
  }
}
