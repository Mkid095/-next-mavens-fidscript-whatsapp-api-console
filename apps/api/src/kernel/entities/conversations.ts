import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { normalizePhone } from '../../utils/phone.js';
import { dispatchConversationCreated, dispatchCustomerCreated } from '../events/index.js';
import type { WorkspaceContext } from '../identity/index.js';

// =============================================================================
// resolveConversation — THE canonical chokepoint for customer + conversation.
// Every inbound/outbound message routes through here.
// Returns { customerId, conversationId } — caller writes to inbox_messages.
// =============================================================================

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
  identifier: string,       // canonical phone or full JID
  instanceId?: string,
  displayName?: string | null,
  pushName?: string | null,
): Promise<ResolveResult> {
  const now = new Date().toISOString();

  // 1. Normalize identifier
  const isGroup = identifier.includes('@g.us') || identifier.includes('@s.whatsapp.net');
  const canonicalValue = isGroup
    ? identifier
    : normalizePhone(identifier);

  if (!canonicalValue) {
    throw new Error(`Cannot resolve empty identifier for channel ${channel}`);
  }

  // 2. Upsert customer
  const existingIdentifier = db.prepare(`
    SELECT ci.customer_id FROM customer_identifiers ci
    JOIN customers c ON c.id = ci.customer_id
    WHERE ci.value = ? AND ci.channel = ? AND c.workspace_id = ?
  `).get(canonicalValue, channel, ctx.workspaceId) as { customer_id: string } | undefined;

  let customerId: string;
  let isNewCustomer = false;

  if (existingIdentifier) {
    customerId = existingIdentifier.customer_id;
    db.prepare('UPDATE customers SET last_seen_at = ? WHERE id = ?').run(now, customerId);
  } else {
    customerId = uuidv4();
    const name = displayName || pushName || null;
    db.prepare(`
      INSERT INTO customers (id, workspace_id, display_name, last_seen_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(customerId, ctx.workspaceId, name, now, now);
    isNewCustomer = true;

    await dispatchCustomerCreated(ctx, {
      customerId,
      channel,
      identifier: canonicalValue,
      displayName: name,
    });
  }

  // 3. Upsert customer_identifier
  const existingIdentRow = db.prepare(`
    SELECT id FROM customer_identifiers WHERE customer_id = ? AND channel = ? AND value = ?
  `).get(customerId, channel, canonicalValue) as { id: string } | undefined;

  if (!existingIdentRow) {
    db.prepare(`
      INSERT INTO customer_identifiers (id, customer_id, channel, value, label)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), customerId, channel, canonicalValue, null);
  }

  // 4. Upsert conversation
  const chatId = canonicalValue;
  const existingConv = db.prepare(`
    SELECT id FROM conversations
    WHERE customer_id = ? AND channel = ? AND chat_id = ? AND workspace_id = ?
  `).get(customerId, channel, chatId, ctx.workspaceId) as ConversationRow | undefined;

  let conversationId: string;
  let isNewConversation = false;

  if (existingConv) {
    conversationId = existingConv.id;
    db.prepare('UPDATE conversations SET last_message_at = ? WHERE id = ?').run(now, conversationId);
  } else {
    conversationId = uuidv4();
    db.prepare(`
      INSERT INTO conversations
        (id, workspace_id, customer_id, channel, instance_id, chat_id, last_message_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(conversationId, ctx.workspaceId, customerId, channel, instanceId ?? null, chatId, now, now);

    // ── Stamp SLA deadlines if a matching policy exists ─────────────────────
    const policy = db.prepare(`
      SELECT first_response_minutes, resolution_minutes
        FROM sla_policies
       WHERE workspace_id = ?
         AND (channel = ? OR channel IS NULL)
       ORDER BY channel DESC, priority ASC
       LIMIT 1
    `).get(ctx.workspaceId, channel) as {
      first_response_minutes: number;
      resolution_minutes: number;
    } | undefined;

    if (policy) {
      const createdAt = new Date(now);
      const responseDue = new Date(createdAt.getTime() + policy.first_response_minutes * 60 * 1000);
      const resolutionDue = new Date(createdAt.getTime() + policy.resolution_minutes * 60 * 1000);
      db.prepare(`
        UPDATE conversations
           SET response_due_at = ?,
               resolution_due_at = ?,
               sla_policy_id = (
                 SELECT id FROM sla_policies
                  WHERE workspace_id = ?
                    AND (channel = ? OR channel IS NULL)
                  ORDER BY channel DESC, priority ASC
                  LIMIT 1
               )
         WHERE id = ?
      `).run(responseDue.toISOString(), resolutionDue.toISOString(), ctx.workspaceId, channel, conversationId);
    }

    isNewConversation = true;

    await dispatchConversationCreated(ctx, {
      conversationId,
      customerId,
      channel,
      instanceId,
      chatId,
    });
  }

  return { customerId, conversationId, isNewCustomer, isNewConversation };
}
