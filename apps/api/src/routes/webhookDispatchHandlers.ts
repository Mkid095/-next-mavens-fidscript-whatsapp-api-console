/**
 * Webhook dispatch handlers — resolve conversation, persist message,
 * publish to NATS, emit SSE events.
 */
import { Request } from 'express';
import { resolveConversation } from '../modules/customers/index.js';
import { dispatchMessageReceived, dispatchMessageRead, dispatchMessageDelivered } from '../modules/platform/events/index.js';
import { resolveContactByPhone } from '../services/contactResolver.js';
import { publishChatbotInbound } from '../utils/natsPublisher.js';
import { emitNewMessage, emitMessageReceipt, emitInstanceStateChange } from '../utils/gateway.js';
import { emitDashboardRefresh } from '../utils/dashboardEmitter.js';
import { normalizePhone } from '../utils/phone.js';
import db from '../database.js';
import type { Instance } from '../types.js';
import type { ParsedMessageContext } from './webhookParseHandlers.js';
import { persistInboxMessage, autoCreateContact } from './webhookDbHandlers.js';

export async function dispatchIncomingMessage(
  req: Request,
  instance: Instance & { client_id: string },
  ctx: ParsedMessageContext,
): Promise<void> {
  const workspaceId = instance.client_id;
  const wsCtx = { workspaceId, userId: workspaceId, roleId: 'role_0', perms: ['*'] as string[] };

  let customerId = '';
  let conversationId = '';

  try {
    const resolved = await resolveConversation(
      wsCtx,
      'whatsapp',
      ctx.chatId,
      String(instance.id),
      null,
      ctx.pushName,
    );
    customerId = resolved.customerId;
    conversationId = resolved.conversationId;
  } catch (err) {
    console.error('[WEBHOOK] resolveConversation failed:', err);
  }

  // Persist to inbox_messages
  persistInboxMessage(instance, ctx, conversationId, customerId);

  // Dispatch domain event
  if (customerId && conversationId) {
    dispatchMessageReceived(wsCtx, {
      conversationId,
      customerId,
      channel: 'whatsapp',
      messageId: ctx.msgId,
      messageType: ctx.parsed.messageType,
      content: ctx.parsed.content,
      mediaUrl: ctx.parsed.mediaUrl,
      fromNumber: ctx.phone || ctx.senderJid || '',
      fromName: ctx.resolvedSenderName || null,
    }).catch(err => console.error('[WEBHOOK] dispatchMessageReceived failed:', err));
  }

  // Publish to NATS for async chatbot processing
  let resolvedContactId: string | undefined;
  if (ctx.parsed.messageType === 'text' && ctx.parsed.content && customerId && conversationId) {
    if (ctx.phone) {
      const resolved = resolveContactByPhone(instance.client_id, ctx.phone, ctx.resolvedSenderName ?? null, 'whatsapp');
      resolvedContactId = resolved.contactId;
    }
    publishChatbotInbound({
      conversationId,
      customerId,
      workspaceId: instance.client_id,
      instanceId: String(instance.id),
      instanceName: (instance as { evolution_name?: string }).evolution_name || instance.name,
      message: ctx.parsed.content,
      messageType: ctx.parsed.messageType,
      chatId: ctx.chatId,
      isGroup: ctx.isGroup,
      senderName: ctx.resolvedSenderName,
      senderPhone: ctx.phone ?? undefined,
      groupJid: ctx.isGroup ? ctx.remoteJid : undefined,
      contactId: resolvedContactId,
    }).catch(err => console.error('[WEBHOOK] publishChatbotInbound failed:', err));
  }

  // Auto-create contact for direct messages
  autoCreateContact(req, instance, ctx);

  // Emit SSE events
  const timestamp = new Date().toISOString();
  emitNewMessage(instance.name, {
    id: ctx.msgId,
    from_number: ctx.phone || ctx.senderJid || '',
    from_name: ctx.resolvedSenderName || '',
    message_type: ctx.parsed.messageType,
    content: ctx.parsed.content,
    media_url: ctx.parsed.mediaUrl,
    timestamp,
    chat_id: ctx.chatId,
    is_group: ctx.isGroup ? 1 : 0,
  });
  emitInstanceStateChange(instance.name, 'connected', ctx.phone || null);
  emitDashboardRefresh(instance.client_id);
}

export async function dispatchMessageReceipt(
  req: Request,
  instance: Instance & { client_id: string },
  key: { id?: string; remoteJid?: string },
  receipt: { id?: string; status?: string },
): Promise<void> {
  const messageId = key?.id || receipt?.id || '';
  const status = String(receipt?.status || '').toUpperCase();
  const remoteJid = key?.remoteJid || '';
  const isGroup = remoteJid.includes('@g.us');
  const phone = remoteJid ? (() => { const m = remoteJid.match(/^(\d+)@/); return m ? m[1] : null; })() : null;
  const chatId = isGroup ? remoteJid : (phone ? normalizePhone(phone) : remoteJid);

  if (!messageId) return;

  db.prepare('UPDATE inbox_messages SET is_read = 1 WHERE id = ? AND client_id = ? AND direction = ?')
    .run(messageId, instance.client_id, 'outgoing');

  const wsCtx = { workspaceId: instance.client_id, userId: instance.client_id, roleId: 'role_0', perms: ['*'] as string[] };
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
