import type { Request, Response } from 'express';
import db from '../../database.js';
import { emitMessageReceipt, emitPresence } from '../../utils/evolution.js';
import { resolveConversation } from '../../modules/customers/index.js';
import { dispatchMessageRead, dispatchMessageDelivered } from '../../modules/platform/events/index.js';
import { buildWsCtx, chatIdFromJid, extractPhoneFromJid, type WebhookInstance } from './shared.js';

// messages.receipt — recipient read/delivered our message (blue ticks).
export async function handleMessagesReceipt(
  instance: WebhookInstance,
  data: Record<string, unknown> | undefined,
  res: Response,
): Promise<void> {
  const key = data?.key as { id?: string; remoteJid?: string } | undefined;
  const receipt = data?.receipt as { id?: string; status?: string } | undefined;
  const messageId = key?.id || receipt?.id || '';
  const status = String(receipt?.status || '').toUpperCase();
  const remoteJid = key?.remoteJid || '';
  const { chatId } = chatIdFromJid(remoteJid);

  if (messageId) {
    // Flip our outgoing message to read
    db.prepare('UPDATE inbox_messages SET is_read = 1 WHERE id = ? AND client_id = ? AND direction = ?')
      .run(messageId, instance.client_id, 'outgoing');

    const ctx = buildWsCtx(instance);
    try {
      const resolved = await resolveConversation(ctx, 'whatsapp', chatId, String(instance.id));
      if (status === 'READ' || status === 'PLAYED') {
        dispatchMessageRead(ctx, { conversationId: resolved.conversationId, messageId }).catch(() => {});
      } else if (status === 'DELIVERED' || status === 'DELIVERY') {
        dispatchMessageDelivered(ctx, { conversationId: resolved.conversationId, messageId }).catch(() => {});
      }
    } catch { /* resolution optional for receipts */ }
    emitMessageReceipt(instance.name, chatId, messageId, status || 'READ');
  }
  res.status(200).json({ success: true, handled: true });
}

// presence.update — typing indicator (ephemeral, SSE-only).
export function handlePresenceUpdate(
  instance: WebhookInstance,
  data: Record<string, unknown> | undefined,
  res: Response,
): void {
  const remoteJid = (data?.remoteJid as string) || '';
  const presence = String(data?.presence || data?.status || '');
  const { chatId } = chatIdFromJid(remoteJid);
  const participant = (data?.participant as string) || remoteJid;
  const fromName = participant ? extractPhoneFromJid(participant) : null;
  if (chatId && presence) emitPresence(instance.name, chatId, presence, fromName);
  res.status(200).json({ success: true, handled: true });
}
