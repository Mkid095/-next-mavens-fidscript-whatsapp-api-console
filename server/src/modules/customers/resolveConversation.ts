import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { normalizePhone } from '../../utils/phone.js';
import { dispatchConversationCreated, dispatchCustomerCreated } from '../platform/events/index.js';
import type { WorkspaceContext } from '../platform/workspace/index.js';

// =============================================================================
// resolveConversation — the ONE chokepoint for customer + conversation resolution.
// Every inbound/outbound message routes through here.
// Returns { customerId, conversationId } — caller writes these to inbox_messages.
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
  pushName?: string | null
): Promise<ResolveResult> {
  const now = new Date().toISOString();

  // -------------------------------------------------------------------------
  // 1. Normalize identifier
  // -------------------------------------------------------------------------
  const isGroup = identifier.includes('@g.us') || identifier.includes('@s.whatsapp.net');
  const canonicalValue = isGroup
    ? identifier
    : normalizePhone(identifier);

  if (!canonicalValue) {
    throw new Error(`Cannot resolve empty identifier for channel ${channel}`);
  }

  // -------------------------------------------------------------------------
  // 2. Upsert customer
  // -------------------------------------------------------------------------
  // Try to find existing customer by this identifier
  const existingIdentifier = db.prepare(`
    SELECT ci.customer_id FROM customer_identifiers ci
    JOIN customers c ON c.id = ci.customer_id
    WHERE ci.value = ? AND ci.channel = ? AND c.workspace_id = ?
  `).get(canonicalValue, channel, ctx.workspaceId) as { customer_id: string } | undefined;

  let customerId: string;
  let isNewCustomer = false;

  if (existingIdentifier) {
    customerId = existingIdentifier.customer_id;
    // Update last_seen_at
    db.prepare('UPDATE customers SET last_seen_at = ? WHERE id = ?')
      .run(now, customerId);
  } else {
    // Create new customer
    customerId = uuidv4();
    const name = displayName || pushName || null;
    db.prepare(`
      INSERT INTO customers (id, workspace_id, display_name, last_seen_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(customerId, ctx.workspaceId, name, now, now);
    isNewCustomer = true;

    // Emit customer.created event
    await dispatchCustomerCreated(ctx, {
      customerId,
      channel,
      identifier: canonicalValue,
      displayName: name,
    });
  }

  // -------------------------------------------------------------------------
  // 3. Upsert customer_identifier
  // -------------------------------------------------------------------------
  const existingIdentRow = db.prepare(`
    SELECT id FROM customer_identifiers WHERE customer_id = ? AND channel = ? AND value = ?
  `).get(customerId, channel, canonicalValue) as { id: string } | undefined;

  if (!existingIdentRow) {
    db.prepare(`
      INSERT INTO customer_identifiers (id, customer_id, channel, value, label)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), customerId, channel, canonicalValue, null);
  }

  // -------------------------------------------------------------------------
  // 4. Upsert conversation (customer × channel × instance × chat_id)
  // -------------------------------------------------------------------------
  const chatId = canonicalValue; // canonical identifier is the chat_id
  const existingConv = db.prepare(`
    SELECT id FROM conversations
    WHERE customer_id = ? AND channel = ? AND chat_id = ? AND workspace_id = ?
  `).get(customerId, channel, chatId, ctx.workspaceId) as ConversationRow | undefined;

  let conversationId: string;
  let isNewConversation = false;

  if (existingConv) {
    conversationId = existingConv.id;
    // Update last_message_at
    db.prepare('UPDATE conversations SET last_message_at = ? WHERE id = ?')
      .run(now, conversationId);
  } else {
    conversationId = uuidv4();
    db.prepare(`
      INSERT INTO conversations
        (id, workspace_id, customer_id, channel, instance_id, chat_id, last_message_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(conversationId, ctx.workspaceId, customerId, channel, instanceId ?? null, chatId, now, now);
    isNewConversation = true;

    // Emit conversation.created event
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

// ---------------------------------------------------------------------------
// Helper: get customer by id (workspace-scoped)
// ---------------------------------------------------------------------------

export function getCustomer(
  ctx: WorkspaceContext,
  customerId: string
): CustomerRow | null {
  const row = db.prepare(
    'SELECT * FROM customers WHERE id = ? AND workspace_id = ?'
  ).get(customerId, ctx.workspaceId);
  return (row as CustomerRow | undefined) ?? null;
}

// ---------------------------------------------------------------------------
// Helper: get conversation by id (workspace-scoped)
// ---------------------------------------------------------------------------

export function getConversation(
  ctx: WorkspaceContext,
  conversationId: string
): ConversationRow | null {
  const row = db.prepare(
    'SELECT * FROM conversations WHERE id = ? AND workspace_id = ?'
  ).get(conversationId, ctx.workspaceId);
  return (row as ConversationRow | undefined) ?? null;
}
