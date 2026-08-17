import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { executeStep, type StepRow } from './steps.js';

// =============================================================================
// Drip scheduler (§15.4 - Drip flows).
// startDripScheduler() kicks off a setInterval that processes pending drip
// enrollments every 30s. For each enrollment:
//   1. Look up campaign_steps WHERE campaign_id = ? ORDER BY step_order
//   2. Execute the step at index `current_step`
//   3. Increment current_step; if past last step, mark state=completed
//   4. Set next_step_at = now + next step's delay_seconds (or NULL when done)
// Idempotent: re-running the same tick is safe - next_step_at is the gate.
// =============================================================================

const TICK_MS = 30 * 1000;
let _interval: NodeJS.Timeout | null = null;

interface EnrollmentRow {
  id: string;
  customer_id: string;
  campaign_id: string;
  current_step: number;
  next_step_at: string | null;
  state: string;
}

interface CustomerRow { id: string; phone: string | null; }

export function startDripScheduler(): void {
  if (_interval) return;
  _interval = setInterval(() => { tick().catch(err => console.error('[drip] tick error:', err)); }, TICK_MS);
  // Fire once on boot so a fresh deploy catches anything that should have fired while down.
  tick().catch(err => console.error('[drip] initial tick error:', err));
  console.log(`✅ Drip scheduler started (every ${TICK_MS / 1000}s)`);
}

export function stopDripScheduler(): void {
  if (_interval) { clearInterval(_interval); _interval = null; }
}

async function tick(): Promise<void> {
  const nowIso = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const due = db.prepare(`
    SELECT * FROM drip_enrollments
    WHERE state = 'active' AND next_step_at IS NOT NULL AND next_step_at <= ?
    ORDER BY next_step_at ASC LIMIT 100
  `).all(nowIso) as unknown as EnrollmentRow[];
  if (due.length === 0) return;
  console.log(`[drip] processing ${due.length} due enrollment(s)`);
  for (const enr of due) {
    await processOne(enr).catch(err => console.error(`[drip] enrollment ${enr.id} failed:`, err));
  }
}

async function processOne(enr: EnrollmentRow): Promise<void> {
  // Look up the campaign's workspace + client once (sql.js doesn't accept
  // object bind values - must extract primitives before passing to .get()).
  const campaign = db.prepare('SELECT workspace_id, client_id FROM campaigns WHERE id = ?').get(enr.campaign_id) as { workspace_id: string; client_id: string } | undefined;
  if (!campaign) {
    db.prepare(`UPDATE drip_enrollments SET state = 'failed' WHERE id = ?`).run(enr.id);
    return;
  }

  const customer = db.prepare(`
    SELECT id, (SELECT value FROM customer_identifiers ci WHERE ci.customer_id = c.id AND ci.channel = 'whatsapp' ORDER BY ci.created_at ASC LIMIT 1) AS phone
    FROM customers c WHERE c.id = ? AND c.workspace_id = ?
  `).get(enr.customer_id, campaign.workspace_id) as CustomerRow | undefined;
  if (!customer) {
    db.prepare(`UPDATE drip_enrollments SET state = 'failed' WHERE id = ?`).run(enr.id);
    return;
  }

  const steps = db.prepare(`
    SELECT * FROM campaign_steps WHERE campaign_id = ? ORDER BY step_order ASC
  `).all(enr.campaign_id) as unknown as StepRow[];

  if (enr.current_step >= steps.length) {
    // Past the end - mark complete
    db.prepare(`UPDATE drip_enrollments SET state = 'completed', completed_at = ?, next_step_at = NULL WHERE id = ?`)
      .run(new Date().toISOString(), enr.id);
    return;
  }

  const step = steps[enr.current_step];
  const ctx = { workspaceId: campaign.workspace_id, client: { id: campaign.client_id } };

  const result = await executeStep(ctx, step, customer);
  if (!result.ok) {
    console.warn(`[drip] step ${step.id} for enrollment ${enr.id} failed: ${result.error}`);
    // Don't advance; mark for retry by re-stamping next_step_at = now + 5min
    db.prepare(`UPDATE drip_enrollments SET next_step_at = ? WHERE id = ?`)
      .run(new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '), enr.id);
    return;
  }

  // Advance: increment step, set next_step_at = now + next step's delay_seconds
  const nextStepIdx = enr.current_step + 1;
  if (nextStepIdx >= steps.length) {
    db.prepare(`UPDATE drip_enrollments SET current_step = ?, state = 'completed', completed_at = ?, next_step_at = NULL WHERE id = ?`)
      .run(nextStepIdx, new Date().toISOString(), enr.id);
  } else {
    const nextDelay = Math.max(0, Number(steps[nextStepIdx].delay_seconds || 0));
    const nextAt = new Date(Date.now() + nextDelay * 1000).toISOString().slice(0, 19).replace('T', ' ');
    db.prepare(`UPDATE drip_enrollments SET current_step = ?, last_step_at = CURRENT_TIMESTAMP, next_step_at = ? WHERE id = ?`)
      .run(nextStepIdx, nextAt, enr.id);
  }
}

/** Manually enroll a customer into a drip campaign. Called by the trigger
 *  subscriber or the manual /enroll endpoint. Idempotent (UNIQUE constraint
 *  on customer_id + campaign_id). */
export function enrollCustomer(
  customerId: string,
  campaignId: string
): { ok: boolean; enrollmentId?: string; error?: string } {
  const campaign = db.prepare(`SELECT * FROM campaigns WHERE id = ? AND type = 'drip'`).get(campaignId) as { id: string; workspace_id: string } | undefined;
  if (!campaign) return { ok: false, error: 'drip campaign not found' };
  const customer = db.prepare(`SELECT id FROM customers WHERE id = ? AND workspace_id = ?`).get(customerId, campaign.workspace_id);
  if (!customer) return { ok: false, error: 'customer not in this workspace' };

  const existing = db.prepare(`SELECT id FROM drip_enrollments WHERE customer_id = ? AND campaign_id = ?`)
    .get(customerId, campaignId) as { id: string } | undefined;
  if (existing) return { ok: true, enrollmentId: existing.id };

  const id = `enr_${uuidv4().substring(0, 8)}`;
  // Find the first step's delay; if 0, schedule for immediate
  const firstStep = db.prepare(`SELECT delay_seconds FROM campaign_steps WHERE campaign_id = ? ORDER BY step_order ASC LIMIT 1`)
    .get(campaignId) as { delay_seconds: number } | undefined;
  const firstDelay = Math.max(0, Number(firstStep?.delay_seconds || 0));
  const nextAt = new Date(Date.now() + firstDelay * 1000).toISOString().slice(0, 19).replace('T', ' ');

  db.prepare(`
    INSERT INTO drip_enrollments (id, customer_id, campaign_id, current_step, enrolled_at, last_step_at, next_step_at, state)
    VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, 'active')
  `).run(id, customerId, campaignId, nextAt);
  return { ok: true, enrollmentId: id };
}
