import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { clientJwtAuth } from '../../middleware/auth.js';
import { logAuditAction } from '../../utils/audit.js';
import { resolveSegment, type Filter } from '../../modules/campaigns/segments.js';
import db from '../../database.js';

// =============================================================================
// /api/platform/segments - Phase 5 Slice C. Workspace-scoped saved segments
// (§15.2). CRUD + /preview endpoint that resolves a segment's filter_json to
// a phone list and caches the count + last_computed_at on the row.
// =============================================================================

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string { return req.client!.id; }

interface SegmentRow {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  filter_json: string;
  contact_count: number;
  last_computed_at: string | null;
  created_at: string;
  updated_at: string;
}

function serialize(r: SegmentRow) {
  let parsed: Filter = { logic: 'AND', rules: [] };
  try { parsed = JSON.parse(r.filter_json) as Filter; } catch { /* keep default */ }
  return {
    id: r.id,
    workspace_id: r.workspace_id,
    name: r.name,
    description: r.description,
    filter: parsed,
    contact_count: r.contact_count,
    last_computed_at: r.last_computed_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// GET / - list
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM campaign_segments WHERE workspace_id = ? ORDER BY updated_at DESC
    `).all(wsId(req)) as unknown as SegmentRow[];
    res.json({ success: true, data: rows.map(serialize) });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// POST / - create
router.post('/', (req: Request, res: Response) => {
  try {
    const name = ((req.body?.name as string) || '').trim();
    if (!name) { res.status(400).json({ success: false, error: 'name is required' }); return; }
    const id = `seg_${uuidv4().substring(0, 8)}`;
    const filter = req.body?.filter ?? { logic: 'AND', rules: [] };
    const description = (req.body?.description as string) || null;

    db.prepare(`
      INSERT INTO campaign_segments (id, workspace_id, name, description, filter_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, wsId(req), name, description, JSON.stringify(filter));

    logAuditAction(req, 'SEGMENT_CREATED', 'campaign_segment', id, name);
    const row = db.prepare('SELECT * FROM campaign_segments WHERE id = ?').get(id) as unknown as SegmentRow;
    res.status(201).json({ success: true, data: serialize(row) });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// PATCH /:id - update
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT * FROM campaign_segments WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req)) as SegmentRow | undefined;
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const fields: string[] = [];
    const params: unknown[] = [];
    if (typeof req.body?.name === 'string') { fields.push('name = ?'); params.push(req.body.name.trim()); }
    if (typeof req.body?.description === 'string') { fields.push('description = ?'); params.push(req.body.description); }
    if (req.body?.filter) { fields.push('filter_json = ?'); params.push(JSON.stringify(req.body.filter)); }
    if (!fields.length) { res.json({ success: true }); return; }
    fields.push("updated_at = CURRENT_TIMESTAMP");
    params.push(req.params.id);
    db.prepare(`UPDATE campaign_segments SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    logAuditAction(req, 'SEGMENT_UPDATED', 'campaign_segment', req.params.id, JSON.stringify(req.body));
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// DELETE /:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT name FROM campaign_segments WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req)) as { name: string } | undefined;
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    db.prepare('DELETE FROM campaign_segments WHERE id = ?').run(req.params.id);
    logAuditAction(req, 'SEGMENT_DELETED', 'campaign_segment', req.params.id, owned.name);
    res.json({ success: true });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// POST /:id/preview - resolve the segment to a phone list, cache the count
router.post('/:id/preview', (req: Request, res: Response) => {
  try {
    const owned = db.prepare('SELECT * FROM campaign_segments WHERE id = ? AND workspace_id = ?').get(req.params.id, wsId(req)) as SegmentRow | undefined;
    if (!owned) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const filter = JSON.parse(owned.filter_json) as Filter;
    const result = resolveSegment(filter, wsId(req));
    db.prepare(`
      UPDATE campaign_segments
      SET contact_count = ?, last_computed_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(result.customer_count, result.computed_at, req.params.id);
    // Return up to 50 sample phones for the UI preview pane
    res.json({
      success: true,
      data: {
        customer_count: result.customer_count,
        phones: result.phones,
        sample_phones: result.phones.slice(0, 50),
        computed_at: result.computed_at,
      },
    });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

// POST /preview - resolve an ad-hoc filter_json (not yet saved). Used by the
// builder's "Preview" button before save.
router.post('/preview-adhoc', (req: Request, res: Response) => {
  try {
    const filter = (req.body?.filter ?? { logic: 'AND', rules: [] }) as Filter;
    const result = resolveSegment(filter, wsId(req));
    res.json({
      success: true,
      data: {
        customer_count: result.customer_count,
        phones: result.phones,
        sample_phones: result.phones.slice(0, 50),
        computed_at: result.computed_at,
      },
    });
  } catch (err: unknown) { res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) }); }
});

export default router;
