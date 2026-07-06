import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../../middleware/auth.js';
import db from '../../../database.js';

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string {
  return (req as Request & { client: { id: string } }).client!.id;
}

// ─── Delete Draft ─────────────────────────────────────────────────────────────

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const info = db.prepare(
      'DELETE FROM chatbot_drafts WHERE id = ? AND workspace_id = ?'
    ).run(req.params.id, workspaceId);

    if (info.changes === 0) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    res.json({ success: true, message: 'Draft deleted' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
