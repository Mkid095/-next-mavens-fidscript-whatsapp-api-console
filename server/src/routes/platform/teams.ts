import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clientJwtAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';
import db from '../../database.js';

// =============================================================================
// /api/platform/teams — Phase 3 team management (§4.5).
// Workspace-scoped. A team has 0..N members (users). Used for conversation
// assignment + customer ownership.
// =============================================================================

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string { return req.client!.id; }

// GET / — list teams in this workspace
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT t.id, t.name, t.created_at,
             (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
      FROM teams t WHERE t.workspace_id = ? ORDER BY t.name ASC
    `).all(wsId(req));
    res.json({ success: true, data: rows });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// POST / — create a team
router.post('/', (req: Request, res: Response) => {
  try {
    const name = ((req.body?.name as string) || '').trim();
    if (!name) { res.status(400).json({ success: false, error: 'name is required' }); return; }
    const id = uuidv4();
    db.prepare('INSERT INTO teams (id, workspace_id, name) VALUES (?, ?, ?)').run(id, wsId(req), name);
    logAuditAction(req, 'TEAM_CREATED', 'team', id, name);
    res.json({ success: true, data: { id, name } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// PATCH /:id — rename
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const name = ((req.body?.name as string) || '').trim();
    if (!name) { res.status(400).json({ success: false, error: 'name is required' }); return; }
    const owned = db.prepare('SELECT 1 FROM teams WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(name, req.params.id);
    logAuditAction(req, 'TEAM_RENAMED', 'team', req.params.id, name);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// DELETE /:id — remove a team
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM teams WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    db.prepare('DELETE FROM team_members WHERE team_id = ?').run(req.params.id);
    db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);
    logAuditAction(req, 'TEAM_DELETED', 'team', req.params.id);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// GET /:id/members — list team members
router.get('/:id/members', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM teams WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const rows = db.prepare(`
      SELECT tm.id, tm.user_id, tm.joined_at, u.email, u.name
      FROM team_members tm LEFT JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = ? ORDER BY tm.joined_at ASC
    `).all(req.params.id);
    res.json({ success: true, data: rows });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// POST /:id/members — add member
router.post('/:id/members', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM teams WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const userId = (req.body?.user_id as string) ?? '';
    if (!userId) { res.status(400).json({ success: false, error: 'user_id is required' }); return; }
    const existing = db.prepare('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?').get(req.params.id, userId);
    if (existing) { res.json({ success: true, data: { id: (existing as { id: string }).id, dedup: true } }); return; }
    const id = uuidv4();
    db.prepare('INSERT INTO team_members (id, team_id, user_id) VALUES (?, ?, ?)').run(id, req.params.id, userId);
    logAuditAction(req, 'TEAM_MEMBER_ADDED', 'team', req.params.id, userId);
    res.json({ success: true, data: { id } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// DELETE /:id/members/:userId — remove member
router.delete('/:id/members/:userId', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT 1 FROM teams WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
    logAuditAction(req, 'TEAM_MEMBER_REMOVED', 'team', req.params.id, req.params.userId);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

export default router;
