import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clientJwtAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';
import db from '../../database.js';

// =============================================================================
// /api/platform/automation-rules — Phase 4 keyword rules (AI inbound simple
// form, §10.1). The richer DAG flows live under /api/platform/automations
// (flow-based). Both share the same bus subscriber.
// =============================================================================

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string { return req.client!.id; }

router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT id, keyword, reply, confidence_threshold, escalate_on_low_confidence, set_ai_state, enabled, created_at
      FROM ai_keyword_rules WHERE workspace_id = ? ORDER BY created_at DESC
    `).all(wsId(req));
    res.json({ success: true, data: rows });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const keyword = ((req.body?.keyword as string) || '').trim();
    const reply = ((req.body?.reply as string) || '').trim();
    if (!keyword || !reply) { res.status(400).json({ success: false, error: 'keyword and reply required' }); return; }
    const id = uuidv4();
    db.prepare(`
      INSERT INTO ai_keyword_rules (id, workspace_id, keyword, reply, confidence_threshold, escalate_on_low_confidence, set_ai_state, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, wsId(req), keyword, reply,
      Number(req.body?.confidence_threshold) || 0.7,
      req.body?.escalate_on_low_confidence === false ? 0 : 1,
      (req.body?.set_ai_state as string) ?? 'escalated',
      req.body?.enabled === false ? 0 : 1,
    );
    logAuditAction(req, 'AI_RULE_CREATED', 'ai_keyword_rule', id, keyword);
    res.json({ success: true, data: { id } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.patch('/:id', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM ai_keyword_rules WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const fields: string[] = [];
    const params: unknown[] = [];
    for (const k of ['keyword', 'reply', 'confidence_threshold', 'set_ai_state'] as const) {
      if (req.body?.[k] !== undefined) { fields.push(`${k} = ?`); params.push(req.body[k]); }
    }
    if (req.body?.escalate_on_low_confidence !== undefined) { fields.push('escalate_on_low_confidence = ?'); params.push(req.body.escalate_on_low_confidence ? 1 : 0); }
    if (req.body?.enabled !== undefined) { fields.push('enabled = ?'); params.push(req.body.enabled ? 1 : 0); }
    if (fields.length) {
      params.push(req.params.id);
      db.prepare(`UPDATE ai_keyword_rules SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    }
    logAuditAction(req, 'AI_RULE_UPDATED', 'ai_keyword_rule', req.params.id);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM ai_keyword_rules WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    db.prepare('DELETE FROM ai_keyword_rules WHERE id = ?').run(req.params.id);
    logAuditAction(req, 'AI_RULE_DELETED', 'ai_keyword_rule', req.params.id);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

export default router;
