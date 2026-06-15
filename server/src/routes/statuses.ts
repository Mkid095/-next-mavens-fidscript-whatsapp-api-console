import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../middleware/auth.js';
import { logAuditAction } from '../utils/audit.js';
import {
  listStatusPosts, getStatusPost, createStatusPost, updateStatusPost,
  deleteStatusPost, scheduleStatusPost, cancelStatusPost, postStatusNow,
  type CreateStatusInput,
} from '../modules/campaigns/statuses.js';

const router = Router();

// All status routes are workspace-scoped via req.client!.id (P11 bridge).
function wid(req: Request): string { return req.client!.id; }

// GET /api/campaigns/statuses - list all status posts for the client
router.get('/', clientJwtAuth, (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: listStatusPosts(wid(req)) });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/campaigns/statuses - create a new status post (draft or scheduled)
router.post('/', clientJwtAuth, (req: Request, res: Response) => {
  try {
    const created = createStatusPost(wid(req), req.client!.id, req.body as CreateStatusInput);
    logAuditAction(req, 'STATUS_CREATED', 'status_post', created.id, JSON.stringify({ kind: created.kind, scheduled: !!created.scheduled_at }));
    res.status(201).json({ success: true, data: created });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes('required') || msg.includes('must be') ? 400 : 500;
    res.status(status).json({ success: false, error: msg });
  }
});

// GET /api/campaigns/statuses/:id - single status post
router.get('/:id', clientJwtAuth, (req: Request, res: Response) => {
  const row = getStatusPost(req.params.id, wid(req));
  if (!row) { res.status(404).json({ success: false, error: 'Not found' }); return; }
  res.json({ success: true, data: row });
});

// PATCH /api/campaigns/statuses/:id - edit a draft / cancelled status
router.patch('/:id', clientJwtAuth, (req: Request, res: Response) => {
  try {
    const updated = updateStatusPost(req.params.id, wid(req), req.body);
    logAuditAction(req, 'STATUS_UPDATED', 'status_post', req.params.id, JSON.stringify(req.body));
    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg === 'Not found' ? 404 : msg.includes('Cannot edit') ? 400 : 500;
    res.status(status).json({ success: false, error: msg });
  }
});

// DELETE /api/campaigns/statuses/:id - delete a status (any state except 'posting')
router.delete('/:id', clientJwtAuth, (req: Request, res: Response) => {
  try {
    deleteStatusPost(req.params.id, wid(req));
    logAuditAction(req, 'STATUS_DELETED', 'status_post', req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg === 'Not found' ? 404 : msg.includes('Cannot delete') ? 400 : 500;
    res.status(status).json({ success: false, error: msg });
  }
});

// POST /api/campaigns/statuses/:id/schedule - schedule a draft for a future time
router.post('/:id/schedule', clientJwtAuth, (req: Request, res: Response) => {
  try {
    const { scheduled_at } = req.body ?? {};
    if (!scheduled_at) { res.status(400).json({ success: false, error: 'scheduled_at is required' }); return; }
    const updated = scheduleStatusPost(req.params.id, wid(req), scheduled_at);
    logAuditAction(req, 'STATUS_SCHEDULED', 'status_post', req.params.id, scheduled_at);
    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg === 'Not found' ? 404 : msg.includes('Cannot schedule') ? 400 : 500;
    res.status(status).json({ success: false, error: msg });
  }
});

// POST /api/campaigns/statuses/:id/cancel - cancel a scheduled / draft status
router.post('/:id/cancel', clientJwtAuth, (req: Request, res: Response) => {
  try {
    const updated = cancelStatusPost(req.params.id, wid(req));
    logAuditAction(req, 'STATUS_CANCELLED', 'status_post', req.params.id);
    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg === 'Not found' ? 404 : msg.includes('Cannot cancel') ? 400 : 500;
    res.status(status).json({ success: false, error: msg });
  }
});

// POST /api/campaigns/statuses/:id/post - post now (manual fire)
router.post('/:id/post', clientJwtAuth, async (req: Request, res: Response) => {
  const row = getStatusPost(req.params.id, wid(req));
  if (!row) { res.status(404).json({ success: false, error: 'Not found' }); return; }
  if (row.post_state === 'posted' || row.post_state === 'posting') {
    res.status(400).json({ success: false, error: `Status is already ${row.post_state}` });
    return;
  }
  try {
    const result = await postStatusNow(row, req);
    if (!result.ok) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    const fresh = getStatusPost(req.params.id, wid(req));
    res.json({ success: true, data: fresh });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
