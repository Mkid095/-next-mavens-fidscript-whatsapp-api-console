/**
 * slaScheduler.ts — SLA monitoring tick.
 *
 * Every TICK_MS (30s), finds conversations where SLA deadlines have passed
 * without being met and emits domain events so automations can react.
 *
 * Two cases:
 *   1. response_due_at passed + first_response_at IS NULL  →  sla.response_due
 *   2. resolution_due_at passed + resolved_at IS NULL     →  sla.breached
 *
 * Once breached, a conversation is not re-breached. The scheduler only acts
 * on conversations that have an sla_policy_id and are not yet resolved.
 */
import db from '../../database.js';
import { dispatchSlaResponseDue, dispatchSlaBreached } from '../../kernel/events/index.js';
import type { DispatchContext } from '../../kernel/events/index.js';

const TICK_MS = 30 * 1000;
let _interval: NodeJS.Timeout | null = null;

export function startSlaScheduler(): void {
  if (_interval) return;
  _interval = setInterval(() => {
    tick().catch(err => console.error('[sla-scheduler] tick error:', err));
  }, TICK_MS);
  tick().catch(err => console.error('[sla-scheduler] initial tick error:', err));
  console.log(`✅ SLA scheduler started (every ${TICK_MS / 1000}s)`);
}

export function stopSlaScheduler(): void {
  if (_interval) { clearInterval(_interval); _interval = null; }
}

async function tick(): Promise<void> {
  const nowIso = new Date().toISOString();

  // ── 1. First-response due ─────────────────────────────────────────────────
  // Conversations past response_due_at with no first response yet
  const responseDue = db.prepare(`
    SELECT c.id, c.workspace_id, c.sla_policy_id
    FROM conversations c
    WHERE c.sla_policy_id IS NOT NULL
      AND c.first_response_at IS NULL
      AND c.response_due_at IS NOT NULL
      AND c.response_due_at <= ?
      AND c.breached_at IS NULL
  `).all(nowIso) as Array<{ id: string; workspace_id: string; sla_policy_id: string }>;

  if (responseDue.length > 0) {
    console.log(`[sla-scheduler] ${responseDue.length} conversation(s) past first-response deadline`);
  }

  for (const conv of responseDue) {
    try {
      const ctx: DispatchContext = { workspaceId: conv.workspace_id };
      await dispatchSlaResponseDue(ctx, {
        conversationId: conv.id,
        policyId: conv.sla_policy_id,
      });
      // Mark breached so we don't re-dispatch
      db.prepare(`UPDATE conversations SET breached_at = ? WHERE id = ?`)
        .run(nowIso, conv.id);
    } catch (err) {
      console.error(`[sla-scheduler] sla.response_due error for conv ${conv.id}:`, err);
    }
  }

  // ── 2. Resolution-breached ───────────────────────────────────────────────
  // Conversations past resolution_due_at that are still open
  const resolutionBreached = db.prepare(`
    SELECT c.id, c.workspace_id, c.sla_policy_id
    FROM conversations c
    WHERE c.sla_policy_id IS NOT NULL
      AND c.resolved_at IS NULL
      AND c.resolution_due_at IS NOT NULL
      AND c.resolution_due_at <= ?
      AND c.breached_at IS NULL
  `).all(nowIso) as Array<{ id: string; workspace_id: string; sla_policy_id: string }>;

  if (resolutionBreached.length > 0) {
    console.log(`[sla-scheduler] ${resolutionBreached.length} conversation(s) past resolution deadline`);
  }

  for (const conv of resolutionBreached) {
    try {
      const ctx: DispatchContext = { workspaceId: conv.workspace_id };
      await dispatchSlaBreached(ctx, {
        conversationId: conv.id,
        policyId: conv.sla_policy_id,
        kind: 'resolution',
      });
      db.prepare(`UPDATE conversations SET breached_at = ? WHERE id = ?`)
        .run(nowIso, conv.id);
    } catch (err) {
      console.error(`[sla-scheduler] sla.breached error for conv ${conv.id}:`, err);
    }
  }
}
