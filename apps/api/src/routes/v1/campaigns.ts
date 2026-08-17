/**
 * /api/v1/campaigns - campaign read API for external developers.
 * Auth: API key. Read-only list of campaigns and their send stats.
 */
import { Router, Request, Response } from 'express';
import { clientApiKeyAuth } from '../../middleware/auth.js';
import { V1_READ } from '../../middleware/auth/v1Limits.js';
import db from '../../database.js';

const router = Router();
router.use(clientApiKeyAuth, V1_READ);

function clientId(req: Request): string { return req.client!.id; }

/** GET /api/v1/campaigns - list campaigns */
router.get('/', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT id, name, message_type, status, content, media_url, caption,
             total_recipients, sent_count, delivered_count, failed_count,
             scheduled_at, started_at, completed_at, created_at
      FROM campaigns
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).all(clientId(req));
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** POST /api/v1/campaigns - create a draft campaign */
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, message_type, content, media_url, caption, scheduled_at } = req.body as {
      name?: string;
      message_type?: string;
      content?: string;
      media_url?: string;
      caption?: string;
      scheduled_at?: string;
    };
    const id = `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`
      INSERT INTO campaigns (id, client_id, name, message_type, content, media_url, caption,
                           status, total_recipients, sent_count, delivered_count, failed_count,
                           scheduled_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', 0, 0, 0, 0, ?, datetime('now'))
    `).run(id, clientId(req), name ?? 'Untitled Campaign',
      message_type ?? 'text', content ?? '', media_url ?? null, caption ?? null,
      scheduled_at ?? null);
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: campaign });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** POST /api/v1/campaigns/:id/start - start a draft campaign */
router.post('/:id/start', (req: Request, res: Response) => {
  try {
    const campaign = db.prepare('SELECT id, status FROM campaigns WHERE id = ? AND client_id = ?')
      .get(req.params.id, clientId(req)) as { id: string; status: string } | undefined;
    if (!campaign) { res.status(404).json({ success: false, error: 'Campaign not found' }); return; }
    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      res.status(400).json({ success: false, error: `Cannot start campaign with status '${campaign.status}'` }); return;
    }
    db.prepare(`UPDATE campaigns SET status = 'running', started_at = datetime('now') WHERE id = ?`)
      .run(req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** POST /api/v1/campaigns/:id/pause - pause a running campaign */
router.post('/:id/pause', (req: Request, res: Response) => {
  try {
    const campaign = db.prepare('SELECT id, status FROM campaigns WHERE id = ? AND client_id = ?')
      .get(req.params.id, clientId(req)) as { id: string; status: string } | undefined;
    if (!campaign) { res.status(404).json({ success: false, error: 'Campaign not found' }); return; }
    if (campaign.status !== 'running') {
      res.status(400).json({ success: false, error: `Cannot pause campaign with status '${campaign.status}'` }); return;
    }
    db.prepare(`UPDATE campaigns SET status = 'paused' WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** GET /api/v1/campaigns/:id - campaign detail */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const campaign = db.prepare(
      'SELECT * FROM campaigns WHERE id = ? AND client_id = ?'
    ).get(req.params.id, clientId(req));
    if (!campaign) { res.status(404).json({ success: false, error: 'Campaign not found' }); return; }

    const recipients = db.prepare(
      'SELECT id, phone, status, sent_at, delivered_at, failed_at, error_message FROM campaign_recipients WHERE campaign_id = ? LIMIT 200'
    ).all(req.params.id);

    res.json({ success: true, data: { ...campaign as object, recipients } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
