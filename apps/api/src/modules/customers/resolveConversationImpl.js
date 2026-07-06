import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { normalizePhone } from '../../utils/phone.js';
import { dispatchConversationCreated, dispatchCustomerCreated } from '../platform/events/index.js';
import type { WorkspaceContext } from '../platform/workspace/index.js';

export interface ResolveResult {
  customerId: string;
  conversationId: string;
  isNewCustomer: boolean;
  isNewConversation: boolean;
}

interface CustomerRow { id: string; display_name: string | null }
interface ConversationRow { id: string }

export async function resolveConversation(
  ctx: WorkspaceContext,
  channel: 'whatsapp' | 'sms' | 'email' | 'instagram',
  identifier: string,
  instanceId?: string,
  displayName?: string | null,
  pushName?: string | null
): Promise<ResolveResult> {
  const now = new Date().toISOString();
  const isGroup = identifier.includes('@g.us') || identifier.includes('@s.whatsapp.net');

  let canonicalValue = isGroup ? identifier : normalizePhone(identifier);
  if (!isGroup && (identifier.endsWith('@lid') || /^\d{10,}$/.test(identifier))) {
    const stripped = identifier.replace(/@lid$/, '').replace(/^\+/, '');
    const variants = [identifier, identifier.endsWith('@lid') ? identifier : `${identifier}@lid`, stripped, `+${stripped}`, `+${identifier}`, `${stripped}@lid`].filter(Boolean) as string[];

    let linkedPhone: { value: string } | undefined;
    for (const v of variants) {
      linkedPhone = db.prepare(`
        SELECT ci2.value FROM customer_identifiers ci1
        JOIN customer_identifiers ci2 ON ci1.customer_id = ci2.customer_id
        WHERE ci1.value = ? AND ci2.value NOT LIKE '%@%' AND ci2.value != ? LIMIT 1
      `).get(v, v) as { value: string } | undefined;
      if (linkedPhone) break;
    }
    if (linkedPhone) canonicalValue = normalizePhone(linkedPhone.value);
  }

  if (!canonicalValue) throw new Error(`Cannot resolve empty identifier for channel ${channel}`);

  // Upsert customer
  const numericId = canonicalValue.replace(/^\+/, '');
  const existingIdent = db.prepare(`
    SELECT ci.customer_id FROM customer_identifiers ci
    JOIN customers c ON c.id = ci.customer_id
    WHERE ci.channel = ? AND c.workspace_id = ? AND (
      ci.value = ? OR REPLACE(ci.value, '+', '') = ? OR ci.value = ?
    ) ORDER BY length(ci.value) DESC LIMIT 1
  `).get(channel, ctx.workspaceId, canonicalValue, numericId, `${numericId}@lid`) as { customer_id: string } | undefined;

  let customerId: string;
  let isNewCustomer = false;

  if (existingIdent) {
    customerId = existingIdent.customer_id;
    db.prepare('UPDATE customers SET last_seen_at = ? WHERE id = ?').run(now, customerId);
  } else {
    customerId = uuidv4();
    const name = displayName || pushName || null;
    db.prepare(`INSERT INTO customers (id, workspace_id, display_name, last_seen_at, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(customerId, ctx.workspaceId, name, now, now);
    isNewCustomer = true;
    await dispatchCustomerCreated(ctx, { customerId, channel, identifier: canonicalValue, displayName: name });
  }

  // Upsert customer_identifier
  if (!db.prepare('SELECT id FROM customer_identifiers WHERE customer_id = ? AND channel = ? AND value = ?')
    .get(customerId, channel, canonicalValue)) {
    db.prepare(`INSERT INTO customer_identifiers (id, customer_id, channel, value, label) VALUES (?, ?, ?, ?, ?)`)
      .run(uuidv4(), customerId, channel, canonicalValue, null);
  }

  // Upsert conversation
  const phoneJid = numericId && /^\d+$/.test(numericId) && numericId.length >= 7 ? `+${numericId}` : canonicalValue;
  const existingConv = db.prepare(`
    SELECT id, chat_id FROM conversations
    WHERE customer_id = ? AND channel = ? AND workspace_id = ?
    ORDER BY length(chat_id) DESC, chat_id DESC LIMIT 1
  `).get(customerId, channel, ctx.workspaceId) as ConversationRow & { chat_id: string } | undefined;

  let conversationId: string;
  let isNewConversation = false;

  if (existingConv) {
    conversationId = existingConv.id;
    const isPhone = /^\+\d+$/.test(phoneJid) && phoneJid !== existingConv.chat_id;
    if (isPhone) {
      db.prepare('UPDATE conversations SET last_message_at = ?, chat_id = ? WHERE id = ?')
        .run(now, phoneJid, conversationId);
    } else {
      db.prepare('UPDATE conversations SET last_message_at = ? WHERE id = ?').run(now, conversationId);
    }
  } else {
    conversationId = uuidv4();
    db.prepare(`INSERT INTO conversations (id, workspace_id, customer_id, channel, instance_id, chat_id, last_message_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(conversationId, ctx.workspaceId, customerId, channel, instanceId ?? null, phoneJid, now, now);
    isNewConversation = true;
    await dispatchConversationCreated(ctx, { conversationId, customerId, channel, instanceId, chatId: phoneJid });
  }

  return { customerId, conversationId, isNewCustomer, isNewConversation };
}

export function getCustomer(ctx: WorkspaceContext, customerId: string): CustomerRow | null {
  const row = db.prepare('SELECT * FROM customers WHERE id = ? AND workspace_id = ?').get(customerId, ctx.workspaceId);
  return (row as CustomerRow | undefined) ?? null;
}

export function getConversation(ctx: WorkspaceContext, conversationId: string): ConversationRow | null {
  const row = db.prepare('SELECT * FROM conversations WHERE id = ? AND workspace_id = ?').get(conversationId, ctx.workspaceId);
  return (row as ConversationRow | undefined) ?? null;
}
