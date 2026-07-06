import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../../middleware/auth.js';
import db from '../../../database.js';

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string {
  return (req as Request & { client: { id: string } }).client!.id;
}

// ─── Get Draft ───────────────────────────────────────────────────────────────

router.get('/:id', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const row = db.prepare(
      'SELECT * FROM chatbot_drafts WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);

    if (!row) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    res.json({ success: true, data: row });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Publish Job Status ────────────────────────────────────────────────────────

router.get('/publish-jobs/:id', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const row = db.prepare(
      'SELECT * FROM chatbot_publish_jobs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);

    if (!row) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    res.json({ success: true, data: row });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
