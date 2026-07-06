import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../../middleware/auth.js';
import db from '../../../database.js';
import { publishJobEmitter } from '../../../utils/publishJobEmitter.js';
import type { PublishJob } from '../../../types/chatbotDraft.js';

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string {
  return (req as Request & { client: { id: string } }).client!.id;
}

// ─── Draft Upsert ─────────────────────────────────────────────────────────────

router.post('/', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const {
      id,
      chatbot_id = null,
      draft_json,
      last_step = null,
    } = req.body;

    if (!draft_json) {
      return res.status(400).json({ success: false, error: 'draft_json is required' });
    }

    if (!id) {
      return res.status(400).json({ success: false, error: 'id is required' });
    }

    // Verify workspace owns the chatbot if chatbot_id is provided
    if (chatbot_id) {
      const bot = db.prepare(
        'SELECT id FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
      ).get(chatbot_id, workspaceId);
      if (!bot) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
    }

    // Upsert
    const existing = db.prepare('SELECT id FROM chatbot_drafts WHERE id = ? AND workspace_id = ?').get(id, workspaceId);
    if (existing) {
      db.prepare(`UPDATE chatbot_drafts SET
        draft_json = ?,
        last_step = ?,
        chatbot_id = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND workspace_id = ?`
      ).run(draft_json, last_step, chatbot_id, id, workspaceId);
    } else {
      db.prepare(`INSERT INTO chatbot_drafts (id, workspace_id, chatbot_id, draft_json, last_step)
        VALUES (?, ?, ?, ?, ?)`
      ).run(id, workspaceId, chatbot_id, draft_json, last_step);
    }

    res.json({ success: true, data: { id } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Reset / Requeue Stale Job ───────────────────────────────────────────────

router.post('/publish-jobs/:id/reset', (req: Request, res: Response) => {
  try {
    const workspaceId = wsId(req);
    const job = db.prepare(
      'SELECT * FROM chatbot_publish_jobs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId) as PublishJob | undefined;

    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    if (job.status === 'pending') {
      res.status(409).json({ success: false, error: 'Job is already pending' });
      return;
    }

    const maxRetries = 3;
    const currentRetries = job.retry_count ?? 0;

    if (currentRetries >= maxRetries) {
      res.status(409).json({ success: false, error: 'Maximum retries exceeded' });
      return;
    }

    db.prepare(`UPDATE chatbot_publish_jobs SET
      status = 'pending',
      progress = 0,
      current_step = NULL,
      message = NULL,
      error = NULL,
      result_json = NULL,
      retry_count = retry_count + 1,
      last_heartbeat_at = CURRENT_TIMESTAMP,
      worker_id = NULL,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).run(req.params.id);

    const updated = db.prepare('SELECT * FROM chatbot_publish_jobs WHERE id = ?').get(req.params.id) as unknown as PublishJob;
    publishJobEmitter.emit('jobUpdated', req.params.id, updated);

    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
