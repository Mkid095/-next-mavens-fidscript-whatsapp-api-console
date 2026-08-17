import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clientJwtAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';
import { dispatchCustomerTagged, dispatchCustomerNoted } from '../../modules/platform/events/index.js';
import { whereWorkspace } from '../../modules/platform/workspace/scope.js';
import db from '../../database.js';

// =============================================================================
// /api/platform/customers/:id/{tags,notes,assignments} - Phase 3 CRM surfaces.
// All routes workspace-scoped via req.client.id. Mutations emit domain events
// + write audit_logs rows per spec §6.4. Child tables (tags/notes/assignments)
// are scoped by workspace_id at the SQL layer for P11 defense-in-depth - the
// route's ownedCustomer() check is the upstream gate, whereWorkspace() is the
// SQL-layer guard that prevents leaks if a future route forgets the upstream.
// =============================================================================

const router = Router({ mergeParams: true });
router.use(clientJwtAuth);

function wsId(req: Request): string { return req.client!.id; }
function ctx(req: Request) {
  return { workspaceId: wsId(req), actorUserId: wsId(req) };
}
function ownedCustomer(req: Request): boolean {
  return !!db.prepare(
    'SELECT 1 FROM customers WHERE id = ? AND workspace_id = ?'
  ).get(req.params.id, wsId(req));
}

// --- TAGS -------------------------------------------------------------------
router.get('/:id/tags', (req: Request, res: Response) => {
  try {
    if (!ownedCustomer(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const [where, wparams] = whereWorkspace(req, 'ct');
    const rows = db.prepare(
      `SELECT id, tag, created_at FROM customer_tags ct WHERE ${where} AND ct.customer_id = ? ORDER BY ct.created_at DESC`
    ).all(...wparams, req.params.id);
    res.json({ success: true, data: rows });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/:id/tags', (req: Request, res: Response) => {
  try {
    if (!ownedCustomer(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const tag = ((req.body?.tag as string) || '').trim();
    if (!tag) { res.status(400).json({ success: false, error: 'tag is required' }); return; }
    const [where, wparams] = whereWorkspace(req);
    const existing = db.prepare(`SELECT id FROM customer_tags WHERE ${where} AND customer_id = ? AND tag = ?`)
      .get(...wparams, req.params.id, tag);
    if (existing) { res.json({ success: true, data: { id: (existing as { id: string }).id, tag, dedup: true } }); return; }
    const id = uuidv4();
    db.prepare('INSERT INTO customer_tags (id, customer_id, workspace_id, tag) VALUES (?, ?, ?, ?)')
      .run(id, req.params.id, wsId(req), tag);
    logAuditAction(req, 'CUSTOMER_TAGGED', 'customer', req.params.id, tag);
    dispatchCustomerTagged(ctx(req), { customerId: req.params.id, tag, byUserId: wsId(req) }).catch(() => {});
    res.json({ success: true, data: { id, tag } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.delete('/:id/tags/:tag', (req: Request, res: Response) => {
  try {
    if (!ownedCustomer(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const [where, wparams] = whereWorkspace(req);
    db.prepare(`DELETE FROM customer_tags WHERE ${where} AND customer_id = ? AND tag = ?`).run(...wparams, req.params.id, req.params.tag);
    logAuditAction(req, 'CUSTOMER_UNTAGGED', 'customer', req.params.id, req.params.tag);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// --- NOTES ------------------------------------------------------------------
router.get('/:id/notes', (req: Request, res: Response) => {
  try {
    if (!ownedCustomer(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const [where, wparams] = whereWorkspace(req, 'n');
    const rows = db.prepare(`
      SELECT n.id, n.body, n.created_at, n.author_user_id, u.name as author_name
      FROM customer_notes n LEFT JOIN users u ON u.id = n.author_user_id
      WHERE ${where} AND n.customer_id = ? ORDER BY n.created_at DESC
    `).all(...wparams, req.params.id);
    res.json({ success: true, data: rows });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.post('/:id/notes', (req: Request, res: Response) => {
  try {
    if (!ownedCustomer(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const body = ((req.body?.body as string) || '').trim();
    if (!body) { res.status(400).json({ success: false, error: 'body is required' }); return; }
    const id = uuidv4();
    db.prepare('INSERT INTO customer_notes (id, customer_id, workspace_id, author_user_id, body) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.params.id, wsId(req), wsId(req), body);
    logAuditAction(req, 'CUSTOMER_NOTED', 'customer', req.params.id, body.substring(0, 200));
    dispatchCustomerNoted(ctx(req), { customerId: req.params.id, noteId: id, byUserId: wsId(req) }).catch(() => {});
    res.json({ success: true, data: { id, body, created_at: new Date().toISOString() } });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.delete('/:id/notes/:noteId', (req: Request, res: Response) => {
  try {
    if (!ownedCustomer(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const [where, wparams] = whereWorkspace(req);
    db.prepare(`DELETE FROM customer_notes WHERE ${where} AND id = ? AND customer_id = ?`).run(...wparams, req.params.noteId, req.params.id);
    logAuditAction(req, 'CUSTOMER_NOTE_DELETED', 'customer', req.params.id, req.params.noteId);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// --- ASSIGNMENTS (per-customer owner) ---------------------------------------
router.get('/:id/assignment', (req: Request, res: Response) => {
  try {
    if (!ownedCustomer(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const [where, wparams] = whereWorkspace(req, 'ca');
    const row = db.prepare(`
      SELECT ca.id, ca.owner_user_id, ca.team_id, ca.created_at,
             u.name as owner_name, t.name as team_name
      FROM customer_assignments ca
      LEFT JOIN users u ON u.id = ca.owner_user_id
      LEFT JOIN teams t ON t.id = ca.team_id
      WHERE ${where} AND ca.customer_id = ?
    `).get(...wparams, req.params.id);
    res.json({ success: true, data: row ?? null });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

router.put('/:id/assignment', (req: Request, res: Response) => {
  try {
    if (!ownedCustomer(req)) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const ownerUserId = (req.body?.owner_user_id as string) ?? null;
    const teamId = (req.body?.team_id as string) ?? null;
    if (!ownerUserId && !teamId) { res.status(400).json({ success: false, error: 'owner_user_id or team_id required' }); return; }
    const [where, wparams] = whereWorkspace(req);
    const existing = db.prepare(`SELECT id FROM customer_assignments WHERE ${where} AND customer_id = ?`).get(...wparams, req.params.id) as { id: string } | undefined;
    if (existing) {
      db.prepare('UPDATE customer_assignments SET owner_user_id = ?, team_id = ? WHERE id = ?')
        .run(ownerUserId, teamId, existing.id);
    } else {
      db.prepare('INSERT INTO customer_assignments (id, customer_id, workspace_id, owner_user_id, team_id) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), req.params.id, wsId(req), ownerUserId, teamId);
    }
    logAuditAction(req, 'CUSTOMER_ASSIGNED', 'customer', req.params.id, JSON.stringify({ ownerUserId, teamId }));
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

export default router;
