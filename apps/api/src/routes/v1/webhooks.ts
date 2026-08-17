/**
 * /api/v1/webhooks - webhook management API for external developers.
 * Auth: API key. List, create, and delete webhooks.
 */
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { clientApiKeyAuth } from '../../middleware/auth.js';
import { V1_READ, V1_MUTATE } from '../../middleware/auth/v1Limits.js';
import db from '../../database.js';

const router = Router();
router.use(clientApiKeyAuth);

function clientId(req: Request): string { return req.client!.id; }
function isValidUrl(u: string): boolean {
  try { const url = new URL(u); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; }
}

/** GET /api/v1/webhooks - list webhooks */
router.get('/', V1_READ, (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(
      'SELECT id, url, events, status, created_at, last_delivery_at FROM webhooks WHERE workspace_id = ? ORDER BY created_at DESC'
    ).all(clientId(_req));
    res.json({ success: true, data: rows.map((r: Record<string, unknown>) => ({ ...r, events: JSON.parse((r.events as string) || '[]') })) });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** POST /api/v1/webhooks - create webhook */
router.post('/', V1_MUTATE, (req: Request, res: Response) => {
  try {
    const { url, events } = req.body as { url?: string; events?: string[] };
    if (!url || !isValidUrl(url)) return res.status(400).json({ success: false, error: 'Invalid URL' });
    if (!Array.isArray(events) || events.length === 0) return res.status(400).json({ success: false, error: 'events must be a non-empty array' });

    const id = `wh_${uuidv4().slice(0, 8)}`;
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    db.prepare(`
      INSERT INTO webhooks (id, workspace_id, url, events, secret, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))
    `).run(id, clientId(req), url, JSON.stringify(events), secret);

    res.status(201).json({ success: true, data: { id, url, events, secret } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** DELETE /api/v1/webhooks/:id - delete webhook */
router.delete('/:id', V1_MUTATE, (req: Request, res: Response) => {
  try {
    const result = db.prepare(
      'DELETE FROM webhooks WHERE id = ? AND workspace_id = ?'
    ).run(req.params.id, clientId(req));
    if ((result as { changes: number }).changes === 0) {
      res.status(404).json({ success: false, error: 'Webhook not found' }); return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
