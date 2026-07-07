import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';
import { enrollCustomer } from '../../modules/campaigns/drip.js';

// =============================================================================
// Phase 5 Slice D — Drip flow sub-routes.
// Mounted as router.use('/:id/drip', dripFlowRoutes) on the campaigns router.
// All paths here are RELATIVE to that mount (e.g. GET '/' reads /:id/drip
// enrollments list, POST /steps reads /:id/drip/steps, etc.). Keeps the
// routes file modular without breaking the public URL shape.
// =============================================================================

const router = Router({ mergeParams: true });

function ownedCampaign(req: Request) {
  return db.prepare('SELECT * FROM campaigns WHERE id = ? AND client_id = ?').get(req.params.id, req.client!.id);
}

// --- Steps -----------------------------------------------------------------
router.get('/steps', clientJwtAuth, (req: Request, res: Response) => {
  try {
    if (!ownedCampaign(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const rows = db.prepare('SELECT * FROM campaign_steps WHERE campaign_id = ? ORDER BY step_order ASC').all(req.params.id);
    res.json({ success: true, data: rows });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/steps', clientJwtAuth, (req: Request, res: Response) => {
  try {
    if (!ownedCampaign(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const { step_order, delay_seconds, action_type, action_config } = req.body ?? {};
    if (!action_type) { res.status(400).json({ success: false, error: 'action_type is required' }); return; }
    const id = `step_${uuidv4().substring(0, 8)}`;
    const last = db.prepare('SELECT MAX(step_order) AS mx FROM campaign_steps WHERE campaign_id = ?')
      .get(req.params.id) as { mx: number | null };
    const order = typeof step_order === 'number' ? step_order : (last.mx ?? 0) + 1;
    db.prepare(`
      INSERT INTO campaign_steps (id, campaign_id, step_order, delay_seconds, action_type, action_config)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, order, Math.max(0, Number(delay_seconds ?? 0)), action_type, JSON.stringify(action_config ?? {}));
    logAuditAction(req, 'STEP_CREATED', 'campaign_step', id, action_type);
    const row = db.prepare('SELECT * FROM campaign_steps WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: row });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.patch('/steps/:sid', clientJwtAuth, (req: Request, res: Response) => {
  try {
    if (!ownedCampaign(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const owned = db.prepare('SELECT * FROM campaign_steps WHERE id = ? AND campaign_id = ?')
      .get(req.params.sid, req.params.id);
    if (!owned) { res.status(404).json({ success: false, error: 'Step not found' }); return; }
    const fields: string[] = [];
    const params: unknown[] = [];
    if (typeof req.body?.step_order === 'number') { fields.push('step_order = ?'); params.push(req.body.step_order); }
    if (typeof req.body?.delay_seconds === 'number') { fields.push('delay_seconds = ?'); params.push(Math.max(0, req.body.delay_seconds)); }
    if (typeof req.body?.action_type === 'string') { fields.push('action_type = ?'); params.push(req.body.action_type); }
    if (req.body?.action_config) { fields.push('action_config = ?'); params.push(JSON.stringify(req.body.action_config)); }
    if (!fields.length) { res.json({ success: true }); return; }
    params.push(req.params.sid);
    db.prepare(`UPDATE campaign_steps SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    logAuditAction(req, 'STEP_UPDATED', 'campaign_step', req.params.sid, JSON.stringify(req.body));
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.delete('/steps/:sid', clientJwtAuth, (req: Request, res: Response) => {
  try {
    if (!ownedCampaign(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const owned = db.prepare('SELECT 1 FROM campaign_steps WHERE id = ? AND campaign_id = ?')
      .get(req.params.sid, req.params.id);
    if (!owned) { res.status(404).json({ success: false, error: 'Step not found' }); return; }
    db.prepare('DELETE FROM campaign_steps WHERE id = ?').run(req.params.sid);
    logAuditAction(req, 'STEP_DELETED', 'campaign_step', req.params.sid);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// --- Triggers --------------------------------------------------------------
router.get('/triggers', clientJwtAuth, (req: Request, res: Response) => {
  try {
    if (!ownedCampaign(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const rows = db.prepare('SELECT * FROM campaign_triggers WHERE campaign_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json({ success: true, data: rows });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/triggers', clientJwtAuth, (req: Request, res: Response) => {
  try {
    if (!ownedCampaign(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const { event, filter_json } = req.body ?? {};
    const validEvents = ['customer.created', 'customer.tagged', 'conversation.created', 'order.created'];
    if (!validEvents.includes(event)) { res.status(400).json({ success: false, error: `event must be one of: ${validEvents.join(', ')}` }); return; }
    const id = `trig_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO campaign_triggers (id, campaign_id, event, filter_json, enabled) VALUES (?, ?, ?, ?, 1)
    `).run(id, req.params.id, event, JSON.stringify(filter_json ?? {}));
    logAuditAction(req, 'TRIGGER_CREATED', 'campaign_trigger', id, event);
    const row = db.prepare('SELECT * FROM campaign_triggers WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: row });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.delete('/triggers/:tid', clientJwtAuth, (req: Request, res: Response) => {
  try {
    if (!ownedCampaign(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const owned = db.prepare('SELECT 1 FROM campaign_triggers WHERE id = ? AND campaign_id = ?')
      .get(req.params.tid, req.params.id);
    if (!owned) { res.status(404).json({ success: false, error: 'Trigger not found' }); return; }
    db.prepare('DELETE FROM campaign_triggers WHERE id = ?').run(req.params.tid);
    logAuditAction(req, 'TRIGGER_DELETED', 'campaign_trigger', req.params.tid);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// --- Enrollments (manual + list) -------------------------------------------
router.post('/enroll', clientJwtAuth, (req: Request, res: Response) => {
  try {
    if (!ownedCampaign(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const { customer_id } = req.body ?? {};
    if (!customer_id) { res.status(400).json({ success: false, error: 'customer_id is required' }); return; }
    const result = enrollCustomer(customer_id, req.params.id);
    if (!result.ok) { res.status(400).json({ success: false, error: result.error }); return; }
    logAuditAction(req, 'DRIP_ENROLLED', 'campaign', req.params.id, customer_id);
    res.status(201).json({ success: true, data: { enrollmentId: result.enrollmentId } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.get('/enrollments', clientJwtAuth, (req: Request, res: Response) => {
  try {
    if (!ownedCampaign(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const rows = db.prepare(`
      SELECT e.*, c.display_name AS customer_name
      FROM drip_enrollments e
      LEFT JOIN customers c ON c.id = e.customer_id
      WHERE e.campaign_id = ?
      ORDER BY e.enrolled_at DESC LIMIT 200
    `).all(req.params.id);
    res.json({ success: true, data: rows });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

export default router;
