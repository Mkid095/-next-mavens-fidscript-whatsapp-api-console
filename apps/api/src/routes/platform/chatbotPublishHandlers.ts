/**
 * Chatbot Publish Handlers — publishChatbot and getPublishJob.
 */

import type { Request, Response } from 'express';
import db from '../../database.js';
import { logAuditAction } from '../../utils/audit.js';
import { validatePublish } from '../../modules/chatbot/validation/index.js';
import { runPublishPipeline } from '../../modules/chatbot/publishPipeline.js';
import { wsId } from './chatbotCrudHandlers.js';

export { wsId };

export function publishChatbot(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const bot = db.prepare(
      'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, workspaceId);
    if (!bot) { res.status(404).json({ success: false, error: 'Chatbot not found' }); return; }

    const { draft_json } = req.body;
    if (!draft_json) {
      res.status(400).json({ success: false, error: 'draft_json is required in request body' });
      return;
    }

    let draft: Record<string, unknown>;
    try {
      draft = JSON.parse(draft_json) as Record<string, unknown>;
    } catch {
      res.status(400).json({ success: false, error: 'draft_json must be valid JSON' });
      return;
    }

    const validation = validatePublish(draft as unknown as Parameters<typeof validatePublish>[0]);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_publish_jobs (id, chatbot_id, workspace_id, status, progress, current_step, message)
      VALUES (?, ?, ?, 'pending', 0, 'queued', 'Publish queued…')`
    ).run(jobId, req.params.id, workspaceId);

    runPublishPipeline(req.params.id, workspaceId, draft as unknown as Parameters<typeof runPublishPipeline>[2], jobId);

    logAuditAction(req, 'UPDATE', 'chatbot', req.params.id, `Published chatbot "${bot.name as string}"`);
    res.json({ success: true, data: { jobId }, message: 'Publish started' });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export function getPublishJob(req: Request, res: Response): void {
  try {
    const workspaceId = wsId(req);
    const row = db.prepare(
      'SELECT * FROM chatbot_publish_jobs WHERE chatbot_id = ? AND workspace_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(req.params.id, workspaceId);
    if (!row) { res.status(404).json({ success: false, error: 'No publish job found' }); return; }
    res.json({ success: true, data: row });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
