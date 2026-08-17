/**
 * Webhook DB persistence helpers - insert inbox messages, update contacts,
 * update instance/client timestamps.
 */
import db from '../database.js';
import { normalizePhone } from '../utils/phone.js';
import { logAuditAction } from '../utils/audit.js';
import type { Request } from 'express';
import type { Instance } from '../types.js';
import type { ParsedMessageContext } from './webhookParseHandlers.js';

export function persistInboxMessage(
  instance: Instance & { client_id: string },
  ctx: ParsedMessageContext,
  conversationId: string,
  customerId: string,
): void {
  const timestamp = new Date().toISOString();
  try {
    db.prepare(`
      INSERT OR IGNORE INTO inbox_messages
        (id, instance_id, client_id, from_number, from_name, message_type, content,
         media_url, is_read, direction, extra, raw_payload, chat_id, is_group,
         conversation_id, customer_id, workspace_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'incoming', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ctx.msgId, instance.id, instance.client_id,
      ctx.phone || ctx.remoteJid || '', ctx.resolvedSenderName || '',
      ctx.parsed.messageType, ctx.parsed.content, ctx.parsed.mediaUrl,
      JSON.stringify(ctx.parsed.extra), '{}',
      ctx.chatId, ctx.isGroup ? 1 : 0,
      conversationId || null, customerId || null, instance.client_id,
    );
    db.prepare('UPDATE instances SET last_active = ? WHERE id = ?').run(timestamp, instance.id);
    db.prepare('UPDATE clients SET last_active = ? WHERE id = ?').run(timestamp, instance.client_id);
  } catch {
    // Duplicate message ID - ignore
  }
}

export function autoCreateContact(
  req: Request,
  instance: Instance & { client_id: string },
  ctx: ParsedMessageContext,
): void {
  if (!ctx.phone || ctx.isGroup) return;
  const normalizedPhone = normalizePhone(ctx.phone) || ctx.phone;
  const existing = db.prepare('SELECT id, name FROM contacts WHERE client_id = ? AND phone = ?')
    .get(instance.client_id, normalizedPhone) as { id: string; name: string | null } | undefined;
  if (!existing) {
    db.prepare('INSERT INTO contacts (id, client_id, phone, name, tags) VALUES (?, ?, ?, ?, ?)')
      .run(`auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, instance.client_id, normalizedPhone, ctx.resolvedSenderName || '', 'auto');
  } else if (ctx.resolvedSenderName && !existing.name) {
    db.prepare('UPDATE contacts SET name = ? WHERE id = ?').run(ctx.resolvedSenderName, existing.id);
  }

  const current = db.prepare('SELECT phone_number FROM instances WHERE name = ?').get(instance.name) as { phone_number: string | null } | undefined;
  if (!current?.phone_number) {
    db.prepare('UPDATE instances SET phone_number = ? WHERE name = ?').run(ctx.phone, instance.name);
    logAuditAction(req, 'MESSAGE_RECEIVED', 'instance', String(instance.id), `Phone captured from message: ${ctx.phone}`);
  }
}
