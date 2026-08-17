import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { getInstanceForClient } from '../../services/whatsapp/shared.js';
import { dispatchCampaignMessage, type CampaignMessageKind } from './dispatch.js';

// =============================================================================
// Step executor (§15.4 - Drip flows).
// action_type ∈ { send_text, send_media, add_tag, set_status, wait_branch }
// action_config - JSON shape per action type:
//   send_text:   { text, instance_name? }
//   send_media:  { media_url, caption?, instance_name? }
//   add_tag:     { tag }
//   set_status:  { status }   // conversation status on the customer's last open convo
//   wait_branch: { delay_seconds, condition? }   // conditional wait
//
// The executor is invoked by the drip scheduler (`drip.ts`) for each pending
// enrollment; it never calls the bus directly.
// =============================================================================

export interface StepActionConfig {
  // send_text / send_media
  text?: string;
  media_url?: string;
  caption?: string;
  instance_name?: string;
  // add_tag
  tag?: string;
  // set_status
  status?: 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed';
  // wait_branch
  delay_seconds?: number;
  condition?: 'tag_added' | 'replied' | 'opened';
}

export interface StepRow {
  id: string;
  campaign_id: string;
  step_order: number;
  delay_seconds: number;
  action_type: string;
  action_config: string;
}

export interface StepExecutionResult { ok: boolean; error?: string; }

export async function executeStep(
  ctx: { workspaceId: string; client: { id: string } },
  step: StepRow,
  customer: { id: string; phone: string | null }
): Promise<StepExecutionResult> {
  let cfg: StepActionConfig = {};
  try { cfg = JSON.parse(step.action_config || '{}') as StepActionConfig; } catch { /* defaults */ }

  switch (step.action_type) {
    case 'send_text': {
      if (!customer.phone || !cfg.text) return { ok: false, error: 'missing phone or text' };
      const instanceName = cfg.instance_name || await pickInstanceForCustomer(ctx.workspaceId);
      if (!instanceName) return { ok: false, error: 'no connected instance' };
      return sendViaInstance(ctx, instanceName, customer.phone, 'text', { text: cfg.text });
    }
    case 'send_media': {
      if (!customer.phone || !cfg.media_url) return { ok: false, error: 'missing phone or media_url' };
      const instanceName = cfg.instance_name || await pickInstanceForCustomer(ctx.workspaceId);
      if (!instanceName) return { ok: false, error: 'no connected instance' };
      return sendViaInstance(ctx, instanceName, customer.phone, 'media', { mediaUrl: cfg.media_url, caption: cfg.caption });
    }
    case 'add_tag': {
      if (!cfg.tag) return { ok: false, error: 'missing tag' };
      // Idempotent: insert-if-not-exists
      const exists = db.prepare('SELECT 1 FROM customer_tags WHERE customer_id = ? AND tag = ?').get(customer.id, cfg.tag);
      if (!exists) {
        db.prepare('INSERT INTO customer_tags (id, customer_id, tag) VALUES (?, ?, ?)')
          .run(`tag_${uuidv4().substring(0, 8)}`, customer.id, cfg.tag);
      }
      return { ok: true };
    }
    case 'set_status': {
      if (!cfg.status) return { ok: false, error: 'missing status' };
      // Set on the most recent open conversation for this customer
      db.prepare(`
        UPDATE conversations SET status = ?
        WHERE customer_id = ? AND workspace_id = ?
          AND status IN ('open', 'pending', 'waiting_on_customer')
        ORDER BY last_message_at DESC LIMIT 1
      `).run(cfg.status, customer.id, ctx.workspaceId);
      return { ok: true };
    }
    case 'wait_branch': {
      // No-op - the drip scheduler uses delay_seconds to schedule the next step.
      return { ok: true };
    }
    default:
      return { ok: false, error: `unknown action_type: ${step.action_type}` };
  }
}

async function pickInstanceForCustomer(workspaceId: string): Promise<string | null> {
  const row = db.prepare(
    `SELECT name FROM instances WHERE client_id = ? AND status = 'connected' ORDER BY created_at ASC LIMIT 1`
  ).get(workspaceId) as { name: string } | undefined;
  return row?.name || null;
}

async function sendViaInstance(
  ctx: { workspaceId: string; client: { id: string } },
  instanceName: string,
  phone: string,
  kind: CampaignMessageKind,
  args: { text?: string; mediaUrl?: string; caption?: string }
): Promise<StepExecutionResult> {
  const instance = getInstanceForClient(instanceName, ctx.workspaceId);
  if (!instance) return { ok: false, error: `instance not found: ${instanceName}` };
  // Use a synthetic req for the dispatcher (no HTTP context - steps are server-internal)
  const fakeReq = { headers: {}, get: (h: string) => undefined } as never;
  const result = await dispatchCampaignMessage(
    { instance, client: ctx.client as never, req: fakeReq },
    { recipientId: `step_${uuidv4().substring(0, 8)}`, to: phone, kind, ...args }
  );
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
