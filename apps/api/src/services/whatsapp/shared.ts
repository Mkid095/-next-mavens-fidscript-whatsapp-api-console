import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import db from '../../database.js';
import type { Instance, Client } from '../../types.js';
import { emitTokenUpdate, emitAiOverrideChanged } from '../../utils/gateway.js';
import { logApiRequest } from '../../utils/audit.js';
import { emitDashboardRefresh } from '../../utils/dashboardEmitter.js';
import { normalizePhone } from '../../utils/phone.js';
import { dispatchMessageSent } from '../../modules/platform/events/index.js';
import { resolveConversation } from '../../kernel/entities/index.js';

export interface SendContext {
  instance: Instance & { client_id: string };
  client: Client;
  req: Request;
}

export type SendResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; error: string };

export type OkResult = Extract<SendResult, { ok: true }>;
export type ErrResult = Extract<SendResult, { ok: false }>;
/** Type guard that narrows SendResult even under non-strict tsconfigs. */
export const isOkResult = (r: SendResult): r is OkResult => r.ok === true;

export interface ContactCard { fullName: string; wuid: string; phoneNumber: string; organization?: string; }
export interface MessageKey { remoteJid: string; fromMe: boolean; id: string; }
export interface ListSectionRow { title: string; description?: string; rowId: string; }
export interface ListSection { title: string; rows: ListSectionRow[]; }

/** Resolve the the gateway instance name from an instance record. */
export const gatewayNameOf = (instance: { evolution_name?: string; client_id: string; name: string }): string =>
  instance.evolution_name || `${instance.client_id}_${instance.name}`;

/** Resolve the the gateway instance name for a request context. */
export const gatewayName = (ctx: SendContext): string => gatewayNameOf(ctx.instance);

/** Load an instance owned by a client (client_id promoted to a flat string). */
export function getInstanceForClient(name: string, clientId: string): (Instance & { client_id: string }) | null {
  const row = db.prepare(`
    SELECT i.*, c.id AS client_id
    FROM instances i JOIN clients c ON i.client_id = c.id
    WHERE i.name = ? AND i.client_id = ?
  `).get(name, clientId) as unknown as (Instance & { client_id: string }) | undefined;
  return row ?? null;
}

export function requireConnected(ctx: SendContext): SendResult | null {
  return ctx.instance.status === 'connected' ? null : { ok: false, status: 400, error: 'Instance is not connected' };
}

function deductTokens(clientId: string, amount: number, reference: string): boolean {
  const client = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(clientId) as { token_balance: number } | undefined;
  if (!client || client.token_balance < amount) return false;
  db.prepare('UPDATE clients SET token_balance = token_balance - ? WHERE id = ?').run(amount, clientId);
  db.prepare('INSERT INTO token_transactions (id, client_id, type, amount, reference) VALUES (?, ?, ?, ?, ?)')
    .run(`txn_${uuidv4().substring(0, 8)}`, clientId, 'sent', -amount, reference);
  return true;
}

export function chargeAndEmit(ctx: SendContext, cost: number, reference: string): boolean {
  if (!deductTokens(ctx.instance.client_id, cost, reference)) return false;
  const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(ctx.instance.client_id) as { token_balance: number };
  emitTokenUpdate(ctx.instance.name, updated?.token_balance ?? 0);
  return true;
}

/** Refund a previously-charged amount when a send fails at the gateway. */
export function refundTokens(ctx: SendContext, amount: number, reference: string): void {
  db.prepare('UPDATE clients SET token_balance = token_balance + ? WHERE id = ?').run(amount, ctx.instance.client_id);
  const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(ctx.instance.client_id) as { token_balance: number };
  db.prepare('INSERT INTO token_transactions (id, client_id, type, amount, reference) VALUES (?, ?, ?, ?, ?)')
    .run(`txn_${uuidv4().substring(0, 8)}`, ctx.instance.client_id, 'refund', amount, reference);
  emitTokenUpdate(ctx.instance.name, updated?.token_balance ?? 0);
}

export function saveSentMessage(
  instanceId: string,
  clientId: string,
  workspaceId: string,
  msgId: string,
  to: string,
  content: string,
  messageType = 'text',
  mediaUrl?: string,
  chatId?: string,
  isGroup = 0,
  conversationId?: string,
  customerId?: string,
  senderType = 'agent',
) {
  const normalized = normalizePhone(to);
  const chat = chatId || normalized || null;
  db.prepare(`
    INSERT INTO inbox_messages
      (id, instance_id, client_id, workspace_id, from_number, from_name, message_type,
       content, media_url, is_read, direction, chat_id, is_group, conversation_id, customer_id, sender_type)
    VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, 1, 'outgoing', ?, ?, ?, ?, ?)
  `).run(
    msgId, instanceId, clientId, workspaceId,
    normalized || to, messageType, content, mediaUrl || null,
    chat, isGroup, conversationId || null, customerId || null, senderType,
  );
}

export function updateCounters(instanceName: string, clientId: string) {
  db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(instanceName);
  db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(clientId);
}

/**
 * Resolve the recipient to a customer + conversation for an outbound send.
 * Uses normalizePhone (group JIDs pass through); returns empty ids for
 * non-resolvable targets like 'status' so the invariant holds where it can.
 * Never throws — a resolution failure must not break the send path.
 */
async function resolveOutbound(
  ctx: SendContext,
  to: string
): Promise<{ conversationId?: string; customerId?: string }> {
  const identifier = normalizePhone(to);
  if (!identifier) return {};
  const workspaceId = ctx.instance.client_id; // client_id = workspace_id bridge
  try {
    const resolved = await resolveConversation(
      { workspaceId, userId: workspaceId, roleId: 'role_0', perms: ['*'] },
      'whatsapp',
      identifier,
      String(ctx.instance.id)
    );
    return { conversationId: resolved.conversationId, customerId: resolved.customerId };
  } catch (err) {
    console.error('[shared] resolveOutbound failed:', err);
    return {};
  }
}

export async function finalize(
  ctx: SendContext,
  msgId: string,
  to: string,
  content: string,
  type: string,
  mediaUrl: string | undefined,
  logBody: string,
  chatId?: string,
  isGroup = 0,
  _conversationId?: string,
  _customerId?: string,
  senderType: 'agent' | 'bot' | 'system' = 'agent',
): Promise<void> {
  const workspaceId = ctx.instance.client_id; // client_id = workspace_id bridge

  // Always resolve the conversation for outbound sends. The webhook echo will
  // arrive with the same conversation_id, so deduplication by conversation_id
  // + msgId catches both and renders one bubble. Without this, the sent message
  // is stored with conversation_id=null, the echo lands with the real id, and
  // both appear as separate entries in the thread.
  const resolved = await resolveOutbound(ctx, to);
  const convId = resolved.conversationId;
  const custId = resolved.customerId;

  updateCounters(ctx.instance.name, ctx.instance.client_id);
  saveSentMessage(
    ctx.instance.id, ctx.instance.client_id, workspaceId,
    msgId, to, content, type, mediaUrl, chatId, isGroup,
    convId, custId, senderType,
  );
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, 200, logBody);
  emitDashboardRefresh(ctx.instance.client_id);

  // Emit message.sent so subscribers (search, analytics, timeline) react.
  if (convId && custId) {
    dispatchMessageSent(
      { workspaceId, actorUserId: workspaceId, roleId: 'role_0', perms: ['*'] },
      { conversationId: convId, customerId: custId, messageId: msgId, messageType: type, content, toNumber: to }
    ).catch(err => console.error('[shared] dispatchMessageSent failed:', err));
  }

  // ── Auto-takeover: when an agent sends an outbound reply, automatically pause AI
  // so the next incoming customer message goes to the agent (next_message policy).
  // Only triggers for agent sends that resolved to a real conversation.
  if (senderType === 'agent' && convId) {
    autoTakeoverForAgentReply(ctx.instance.name, workspaceId, convId, ctx.instance.id, (ctx.req as any)?.workspace?.userId);
  }
}

/**
 * Auto-takeover: when an agent manually replies to a conversation where the AI is
 * still active, insert a next_message override so the AI does NOT reply to the
 * next incoming message — the agent has already responded.
 *
 * Only inserts if:
 *   1. No active override exists for this conversation (avoid duplicate stacking)
 *   2. A bot is configured for this workspace/instance
 */
function autoTakeoverForAgentReply(
  instanceName: string,
  workspaceId: string,
  conversationId: string,
  instanceId: string,
  agentUserId?: string,
): void {
  try {
    // Only insert if no active override already exists
    const existing = db.prepare(
      `SELECT id FROM chatbot_conversation_overrides WHERE conversation_id = ? AND status = 'active' LIMIT 1`
    ).get(conversationId);
    if (existing) return; // already overridden or a manual override is in place

    // Find the active bot for this instance
    const bot = db.prepare(`
      SELECT id FROM chatbot_configs
      WHERE instance_id = ? AND workspace_id = ? AND enabled = 1
      LIMIT 1
    `).get(instanceId, workspaceId) as { id: string } | undefined;
    if (!bot) return;

    // Insert a next_message override: AI pauses for one reply then resumes automatically
    db.prepare(`
      INSERT INTO chatbot_conversation_overrides
        (conversation_id, chatbot_id, mode, overridden_at, resume_policy, status, source, ended_reason)
      VALUES (?, ?, 'manual', datetime('now'), 'next_message', 'active', 'automatic', 'agent_reply')
    `).run(conversationId, bot.id);

    // Update conversation's active_agent_id and transition to waiting_customer
    if (agentUserId) {
      db.prepare(`UPDATE conversations SET active_agent_id=?, status='waiting_customer' WHERE id=?`).run(agentUserId, conversationId);
    }

    // Timeline message
    const msgId = `sys_${Date.now()}`;
    db.prepare(`
      INSERT INTO inbox_messages
        (id, conversation_id, workspace_id, from_number, from_name, message_type, content,
         direction, is_read, timestamp, is_system, sender_type)
      VALUES (?, ?, ?, '', 'System', 'text', 'AI paused automatically — agent replied',
              'system', 1, datetime('now'), 1, 'system')
    `).run(msgId, conversationId, workspaceId);

    // Emit SSE so chat list updates in real time
    emitAiOverrideChanged(instanceName, { chatId: conversationId, mode: 'manual' });

    console.log(`[autoTakeover] Agent reply → AI paused for conversation ${conversationId}`);
  } catch (err) {
    // Non-fatal: must never break the send path
    console.error('[autoTakeover] Failed:', err);
  }
}

/**
 * Idempotency wrapper. If the request carries an `Idempotency-Key` header, a
 * prior result for (key, client) is replayed verbatim — no token charge, no
 * gateway call. The first completed result (success OR failure) is cached, so a
 * retried failed send with the same key returns the same error without retrying.
 */
/** 7-day TTL for idempotency key cache entries. */
const IDEMPOTENCY_TTL_DAYS = 7;

function ttlDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + IDEMPOTENCY_TTL_DAYS);
  return d.toISOString();
}

export function wrapSend<A>(
  sender: (ctx: SendContext, args: A) => Promise<SendResult>,
): (ctx: SendContext, args: A) => Promise<SendResult> {
  return async (ctx, args) => {
    const key = ctx.req.get('idempotency-key');
    if (key) {
      const cached = db.prepare('SELECT response_json FROM idempotency_keys WHERE id = ? AND client_id = ?')
        .get(key, ctx.client.id) as { response_json: string } | undefined;
      if (cached) {
        try { return JSON.parse(cached.response_json) as SendResult; } catch { /* corrupt row → fall through */ }
      }
    }
    const result = await sender(ctx, args);
    if (key) {
      try {
        db.prepare('INSERT OR IGNORE INTO idempotency_keys (id, client_id, response_json, status_code, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(key, ctx.client.id, JSON.stringify(result), isOkResult(result) ? 200 : result.status, new Date().toISOString(), ttlDate());
      } catch { /* ignore insert errors */ }
    }
    return result;
  };
}
