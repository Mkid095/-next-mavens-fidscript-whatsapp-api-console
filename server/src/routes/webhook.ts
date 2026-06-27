import { Router, Request, Response } from 'express';
import db from '../database.js';
import { callEvolutionAPI, emitInstanceStateChange, emitNewMessage, emitMessageReceipt, emitPresence } from '../utils/evolution.js';
import { parseIncomingMessage } from '../utils/messageParser.js';
import { logAuditAction } from '../utils/audit.js';
import { emitDashboardRefresh } from '../utils/dashboardEmitter.js';
import { normalizePhone } from '../utils/phone.js';
import { resolveConversation } from '../modules/customers/index.js';
import { dispatchMessageReceived, dispatchMessageRead, dispatchMessageDelivered } from '../modules/platform/events/index.js';
import { syncGroupsForInstance, getGroupParticipantName } from '../services/whatsapp/groupSync.js';
import type { Instance } from '../types.js';

const router = Router();

// Evolution API sends this header to authenticate webhook calls
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '94977bc1fcb107c79d0687caea800bdb74edd67b5022771fc85c22ee389ca7e8';

/**
 * Extract phone number from a WhatsApp JID like "254700000000@s.whatsapp.net"
 */
function extractPhoneFromJid(sender: string): string | null {
  if (!sender) return null;
  // JID format: "254700000000@s.whatsapp.net" or "254700000000.1@s.whatsapp.net"
  const match = sender.match(/^(\d+)@/);
  if (match) {
    const phone = match[1];
    // Format as +254700000000
    return phone.startsWith('0') ? `+${phone}` : `+${phone}`;
  }
  return null;
}

/**
 * POST /api/webhook/evolution
 * Receives webhook events from Evolution API (connection.update, messages.upsert, qrcode.updated).
 * No auth needed — this endpoint is only reachable from the Evolution API server
 * (not public internet), since the URL is private and not exposed.
 */
router.post('/evolution', async (req: Request, res: Response) => {
  const rawBody = req.body as { event?: string; instance?: string; data?: Record<string, unknown>; sender?: string };
  const { event, instance: instanceName } = rawBody;

  const decodedName = instanceName ? decodeURIComponent(instanceName) : '';
  const instance = decodedName
    ? (db.prepare(
        'SELECT * FROM instances WHERE name = ? OR evolution_name = ?'
      ).get(decodedName, decodedName) as (Instance & { client_id: string }) | undefined)
    : undefined;

  console.log('[WEBHOOK] event:', event, 'instance:', decodedName, 'instance found:', !!instance);

  const { data, sender } = rawBody;

  console.log('[WEBHOOK] event:', event, 'instanceName:', decodedName, 'sender:', sender);
  console.log('[WEBHOOK] Instance:', instance ? 'FOUND id=' + instance.id : 'NOT FOUND');

  if (!instance) {
    res.status(200).json({ success: true, handled: false, reason: 'instance_not_found' });
    return;
  }

  // Handle CONNECTION_UPDATE
  if (event === 'connection.update') {
    const state = data?.state as string | undefined;
    const wuid = data?.wuid as string | undefined;

    let status: 'connected' | 'connecting' | 'disconnected' = 'disconnected';
    if (state === 'open') {
      status = 'connected';
    } else if (state === 'connecting') {
      status = 'connecting';
    } else {
      status = 'disconnected';
    }

    // Extract phone number directly from wuid in the payload (e.g. "254732203353@s.whatsapp.net")
    let phoneNumber: string | null = null;
    if (wuid) {
      phoneNumber = extractPhoneFromJid(wuid);
    }

    // Fallback: fetch from Evolution API if not in payload
    if (!phoneNumber && status === 'connected') {
      try {
        const evoName = instance.evolution_name || decodedName;
        const evoRes = await callEvolutionAPI('GET', `/instance/connectionState/${evoName}`);
        const inst = (evoRes.instance as { state?: string; phone?: string; phone_number?: string } | undefined) || evoRes;
        phoneNumber = (inst?.phone as string | undefined) || (inst?.phone_number as string | undefined) || null;
      } catch {
        // Phone number fetch failed — leave as null
      }
    }

    db.prepare('UPDATE instances SET status = ?, phone_number = ?, last_active = ? WHERE name = ?').run(status, phoneNumber, new Date().toISOString(), instance.name);
    logAuditAction(req, 'CONNECTION_STATE', 'instance', String(instance.id), `Webhook: ${instance.name} -> ${status}`);
    // Emit using instance.name (our DB name) to match SSE subscription
    emitInstanceStateChange(instance.name, status, phoneNumber);

    // When the instance connects for the first time (or reconnects), sync all groups
    // so they appear in the inbox immediately — like real WhatsApp
    if (status === 'connected') {
      syncGroupsForInstance(instance, instance.client_id).catch(err =>
        console.error('[webhook] group sync failed:', err)
      );
    }

    res.status(200).json({ success: true, handled: true });
    return;
  }

  // Handle MESSAGES_UPSERT — extract phone from sender JID and update instance
  if (event === 'messages.upsert') {
    const key = data?.key as { remoteJid?: string; fromMe?: boolean; id?: string } | undefined;
    if (key && !key.fromMe) {
      const senderJid = (sender as string | undefined) || key.remoteJid;
      const remoteJid = key.remoteJid || '';
      const isGroup = remoteJid.includes('@g.us');
      const rawPhone = senderJid ? extractPhoneFromJid(senderJid) : null;
      const phone = rawPhone ? normalizePhone(rawPhone) : null;
      const chatId: string = isGroup ? (remoteJid || '') : (phone || remoteJid);
      const msgId = (data?.key as { id?: string })?.id || `msg_${Date.now()}`;
      const pushName = data?.pushName as string | undefined;

      // For group messages, try to resolve the sender's name from our cached contacts.
      // This means if a group member has saved your contact, their messages show your name.
      let resolvedSenderName: string | undefined = pushName;
      if (isGroup && phone) {
        const cachedName = getGroupParticipantName(remoteJid, phone);
        if (cachedName) resolvedSenderName = cachedName;
      }

      const parsed = parseIncomingMessage(data ?? {});
      const timestamp = new Date().toISOString();

      // Resolve customer + conversation (the one chokepoint)
      const workspaceId = instance.client_id; // client_id = workspace_id bridge
      const ctx = { workspaceId, userId: workspaceId, roleId: 'role_0', perms: ['*'] };
      let customerId = '';
      let conversationId = '';

      try {
        const resolved = await resolveConversation(
          ctx,
          'whatsapp',
          chatId,
          String(instance.id),
          null,
          pushName
        );
        customerId = resolved.customerId;
        conversationId = resolved.conversationId;
      } catch (err) {
        console.error('[WEBHOOK] resolveConversation failed:', err);
      }

      try {
        db.prepare(`
          INSERT OR IGNORE INTO inbox_messages
            (id, instance_id, client_id, from_number, from_name, message_type, content,
             media_url, is_read, direction, extra, raw_payload, chat_id, is_group,
             conversation_id, customer_id, workspace_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'incoming', ?, ?, ?, ?, ?, ?, ?)
        `).run(
          msgId, instance.id, instance.client_id, phone || senderJid || '', resolvedSenderName || '',
          parsed.messageType, parsed.content, parsed.mediaUrl,
          JSON.stringify(parsed.extra), JSON.stringify(rawBody),
          chatId, isGroup ? 1 : 0,
          conversationId || null, customerId || null, workspaceId,
        );
        db.prepare('UPDATE instances SET last_active = ? WHERE id = ?').run(timestamp, instance.id);
        db.prepare('UPDATE clients SET last_active = ? WHERE id = ?').run(timestamp, instance.client_id);
      } catch {
        // Duplicate message ID — ignore
      }

      // Emit message.received event (dispatch fills domain_events)
      if (customerId && conversationId) {
        dispatchMessageReceived(ctx, {
          conversationId,
          customerId,
          channel: 'whatsapp',
          messageId: msgId,
          messageType: parsed.messageType,
          content: parsed.content,
          mediaUrl: parsed.mediaUrl,
          fromNumber: phone || senderJid || '',
          fromName: resolvedSenderName || null,
        }).catch(err => console.error('[WEBHOOK] dispatchMessageReceived failed:', err));
      }

      // For direct (non-group) messages, auto-create a contact if unknown
      if (phone && !isGroup) {
        const normalizedPhone = normalizePhone(phone) || phone;
        const existing = db.prepare('SELECT id, name FROM contacts WHERE client_id = ? AND phone = ?').get(instance.client_id, normalizedPhone) as { id: string; name: string | null } | undefined;
        if (!existing) {
          db.prepare('INSERT INTO contacts (id, client_id, phone, name, tags) VALUES (?, ?, ?, ?, ?)')
            .run(`auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, instance.client_id, normalizedPhone, resolvedSenderName || '', 'auto');
        } else if (resolvedSenderName && !existing.name) {
          db.prepare('UPDATE contacts SET name = ? WHERE id = ?').run(resolvedSenderName, existing.id);
        }

        const current = db.prepare('SELECT phone_number FROM instances WHERE name = ?').get(instance.name) as { phone_number: string | null } | undefined;
        if (!current?.phone_number) {
          db.prepare('UPDATE instances SET phone_number = ? WHERE name = ?').run(phone, instance.name);
          logAuditAction(req, 'MESSAGE_RECEIVED', 'instance', String(instance.id), `Phone captured from message: ${phone}`);
        }
      }

      emitNewMessage(instance.name, { id: msgId, from_number: phone || senderJid || '', from_name: resolvedSenderName || '', message_type: parsed.messageType, content: parsed.content, media_url: parsed.mediaUrl, timestamp, chat_id: chatId, is_group: isGroup ? 1 : 0 });
      emitInstanceStateChange(instance.name, 'connected', phone || null);
      emitDashboardRefresh(instance.client_id);
    }
    res.status(200).json({ success: true, handled: true });
    return;
  }

  // Handle MESSAGES_RECEIPT — recipient read/delivered our message (blue ticks)
  if (event === 'messages.receipt') {
    const key = data?.key as { id?: string; remoteJid?: string } | undefined;
    const receipt = data?.receipt as { id?: string; status?: string } | undefined;
    const messageId = key?.id || receipt?.id || '';
    const status = String(receipt?.status || '').toUpperCase();
    const remoteJid = key?.remoteJid || '';
    const isGroup = remoteJid.includes('@g.us');
    const phone = remoteJid ? extractPhoneFromJid(remoteJid) : null;
    const chatId = isGroup ? remoteJid : (phone ? normalizePhone(phone) : remoteJid);

    if (messageId) {
      // Flip our outgoing message to read/delivered
      db.prepare('UPDATE inbox_messages SET is_read = 1 WHERE id = ? AND client_id = ? AND direction = ?')
        .run(messageId, instance.client_id, 'outgoing');

      const wsCtx = { workspaceId: instance.client_id, userId: instance.client_id, roleId: 'role_0', perms: ['*'] };
      try {
        const resolved = await resolveConversation(wsCtx, 'whatsapp', chatId, String(instance.id));
        if (status === 'READ' || status === 'PLAYED') {
          dispatchMessageRead(wsCtx, { conversationId: resolved.conversationId, messageId }).catch(() => {});
        } else if (status === 'DELIVERED' || status === 'DELIVERY') {
          dispatchMessageDelivered(wsCtx, { conversationId: resolved.conversationId, messageId }).catch(() => {});
        }
      } catch { /* resolution optional for receipts */ }
      emitMessageReceipt(instance.name, chatId, messageId, status || 'READ');
    }
    res.status(200).json({ success: true, handled: true });
    return;
  }

  // Handle PRESENCE_UPDATE — typing indicator (ephemeral, pushed to SSE only)
  if (event === 'presence.update') {
    const remoteJid = (data?.remoteJid as string) || '';
    const presence = String(data?.presence || (data as Record<string, unknown>)?.status || '');
    const isGroup = remoteJid.includes('@g.us');
    const phone = remoteJid ? extractPhoneFromJid(remoteJid) : null;
    const chatId = isGroup ? remoteJid : (phone ? normalizePhone(phone) : remoteJid);
    const participant = (data?.participant as string) || remoteJid;
    const fromName = participant ? extractPhoneFromJid(participant) : null;
    if (chatId && presence) emitPresence(instance.name, chatId, presence, fromName);
    res.status(200).json({ success: true, handled: true });
    return;
  }

  // Other events — acknowledge without handling
  res.status(200).json({ success: true, handled: false });
});

export default router;
