import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clientJwtAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';
import db from '../../database.js';

// =============================================================================
// /api/platform/sla-policies — Phase 3 SLA policy CRUD (§9.2).
// Workspace-scoped. A policy is a tuple (channel, priority → first-response
// + resolution minutes). On conversation creation, a subscriber stamps the
// deadlines onto the conversation; a periodic check emits sla.breached.
// =============================================================================

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string { return req.client!.id; }
function owned(req: Request): boolean {
  return !!db.prepare('SELECT 1 FROM sla_policies WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
}

// GET /
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM sla_policies WHERE workspace_id = ? ORDER BY priority ASC, name ASC
    `).all(wsId(req));
    res.json({ success: true, data: rows });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// POST /
router.post('/', (req: Request, res: Response) => {
  try {
    const name = ((req.body?.name as string) || '').trim();
    if (!name) { res.status(400).json({ success: false, error: 'name is required' }); return; }
    const id = uuidv4();
    db.prepare(`
      INSERT INTO sla_policies (id, workspace_id, name, channel, priority, first_response_minutes, resolution_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      wsId(req),
      name,
      (req.body?.channel as string) ?? null,
      (req.body?.priority as string) ?? null,
      Number(req.body?.first_response_minutes) || 60,
      Number(req.body?.resolution_minutes) || 480,
    );
    logAuditAction(req, 'SLA_POLICY_CREATED', 'sla_policy', id, name);
    res.json({ success: true, data: { id } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// PATCH /:id
router.patch('/:id', (req: Request, res: Response) => {
  try {
    if (!owned(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const fields: string[] = [];
    const params: unknown[] = [];
    for (const k of ['name', 'channel', 'priority', 'first_response_minutes', 'resolution_minutes'] as const) {
      if (req.body?.[k] !== undefined) { fields.push(`${k} = ?`); params.push(req.body[k]); }
    }
    if (!fields.length) { res.json({ success: true }); return; }
    params.push(req.params.id);
    db.prepare(`UPDATE sla_policies SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    logAuditAction(req, 'SLA_POLICY_UPDATED', 'sla_policy', req.params.id, JSON.stringify(req.body));
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// DELETE /:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    if (!owned(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    db.prepare('DELETE FROM sla_policies WHERE id = ?').run(req.params.id);
    logAuditAction(req, 'SLA_POLICY_DELETED', 'sla_policy', req.params.id);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

export default router;
