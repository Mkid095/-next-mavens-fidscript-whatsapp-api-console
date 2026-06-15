import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import db from '../../database.js';
import type { Instance, Client } from '../../types.js';
import { emitTokenUpdate } from '../../utils/evolution.js';
import { logApiRequest } from '../../utils/audit.js';
import { emitDashboardRefresh } from '../../utils/dashboardEmitter.js';
import { normalizePhone } from '../../utils/phone.js';
import { dispatchMessageSent } from '../../modules/platform/events/index.js';

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

/** Resolve the Evolution instance name from an instance record. */
export const evolutionNameOf = (instance: { evolution_name?: string; client_id: string; name: string }): string =>
  instance.evolution_name || `${instance.client_id}_${instance.name}`;

/** Resolve the Evolution instance name for a request context. */
export const evolutionName = (ctx: SendContext): string => evolutionNameOf(ctx.instance);

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
) {
  const normalized = normalizePhone(to);
  const chat = chatId || normalized || null;
  db.prepare(`
    INSERT INTO inbox_messages
      (id, instance_id, client_id, workspace_id, from_number, from_name, message_type,
       content, media_url, is_read, direction, chat_id, is_group, conversation_id, customer_id)
    VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, 1, 'outgoing', ?, ?, ?, ?)
  `).run(
    msgId, instanceId, clientId, workspaceId,
    normalized || to, messageType, content, mediaUrl || null,
    chat, isGroup, conversationId || null, customerId || null,
  );
}

export function updateCounters(instanceName: string, clientId: string) {
  db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(instanceName);
  db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(clientId);
}

export function finalize(
  ctx: SendContext,
  msgId: string,
  to: string,
  content: string,
  type: string,
  mediaUrl: string | undefined,
  logBody: string,
  chatId?: string,
  isGroup = 0,
  conversationId?: string,
  customerId?: string,
) {
  const workspaceId = ctx.instance.client_id; // client_id = workspace_id bridge
  updateCounters(ctx.instance.name, ctx.instance.client_id);
  saveSentMessage(
    ctx.instance.id, ctx.instance.client_id, workspaceId,
    msgId, to, content, type, mediaUrl, chatId, isGroup,
    conversationId, customerId,
  );
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, 200, logBody);
  emitDashboardRefresh(ctx.instance.client_id);

  // Emit message.sent event so subscribers (search, analytics, timeline) can react
  if (conversationId && customerId) {
    dispatchMessageSent(
      { workspaceId, actorUserId: workspaceId, roleId: 'role_0', perms: ['*'] },
      { conversationId, customerId, messageId: msgId, messageType: type, content, toNumber: to }
    ).catch(err => console.error('[shared] dispatchMessageSent failed:', err));
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
