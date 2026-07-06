import { Router } from 'express';
import type { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth/clientJwt.js';

const router = Router();

// =============================================================================
// Webhooks CRUD (§14.1).
// clientJwtAuth (existing bridge) provides req.client.id = req.workspaceId.
// =============================================================================

function workspaceOf(req: Request): string {
  return (req as unknown as { client: { id: string } }).client.id;
}

function isValidUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

router.use(clientJwtAuth);

// List
router.get('/', (req, res) => {
  const ws = workspaceOf(req);
  const rows = db.prepare(
    'SELECT id, url, events, status, created_at, last_delivery_at FROM webhooks WHERE workspace_id = ? ORDER BY created_at DESC'
  ).all(ws);
  res.json({ success: true, data: rows.map((r: Record<string, unknown>) => ({ ...r, events: JSON.parse((r.events as string) || '[]') })) });
});

// Create
router.post('/', (req, res) => {
  const ws = workspaceOf(req);
  const { url, events } = req.body as { url?: string; events?: string[] };
  if (!url || !isValidUrl(url)) return res.status(400).json({ success: false, error: 'Invalid URL' });
  if (!Array.isArray(events) || events.length === 0) return res.status(400).json({ success: false, error: 'events must be a non-empty array' });

  const id = `wh_${uuidv4().slice(0, 8)}`;
  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
  db.prepare(`
    INSERT INTO webhooks (id, workspace_id, url, events, secret, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?)
  `).run(id, ws, url, JSON.stringify(events), secret, new Date().toISOString());
  res.json({ success: true, data: { id, url, events, secret, status: 'active' } });
});

// Update
router.patch('/:id', (req, res) => {
  const ws = workspaceOf(req);
  const id = req.params.id;
  const existing = db.prepare('SELECT id FROM webhooks WHERE id = ? AND workspace_id = ?').get(id, ws);
  if (!existing) return res.status(404).json({ success: false, error: 'Webhook not found' });

  const { url, events, status } = req.body as { url?: string; events?: string[]; status?: string };
  const sets: string[] = [];
  const args: unknown[] = [];
  if (url) {
    if (!isValidUrl(url)) return res.status(400).json({ success: false, error: 'Invalid URL' });
    sets.push('url = ?'); args.push(url);
  }
  if (Array.isArray(events)) {
    if (events.length === 0) return res.status(400).json({ success: false, error: 'events cannot be empty' });
    sets.push('events = ?'); args.push(JSON.stringify(events));
  }
  if (status === 'active' || status === 'disabled') {
    sets.push('status = ?'); args.push(status);
  }
  if (sets.length === 0) return res.json({ success: true, data: { id, updated: false } });
  args.push(id, ws);
  db.prepare(`UPDATE webhooks SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`).run(...args);
  res.json({ success: true, data: { id, updated: true } });
});

// Delete
router.delete('/:id', (req, res) => {
  const ws = workspaceOf(req);
  const result = db.prepare('DELETE FROM webhooks WHERE id = ? AND workspace_id = ?').run(req.params.id, ws);
  if (result.changes === 0) return res.status(404).json({ success: false, error: 'Webhook not found' });
  res.json({ success: true, data: { deleted: true } });
});

// Deliveries
router.get('/:id/deliveries', (req, res) => {
  const ws = workspaceOf(req);
  const wh = db.prepare('SELECT id FROM webhooks WHERE id = ? AND workspace_id = ?').get(req.params.id, ws);
  if (!wh) return res.status(404).json({ success: false, error: 'Webhook not found' });
  const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 200);
  const rows = db.prepare(`
    SELECT id, event_type, response_code, attempt, delivered_at, error, created_at
    FROM webhook_deliveries WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ?
  `).all(req.params.id, limit);
  res.json({ success: true, data: rows });
});

export default router;
