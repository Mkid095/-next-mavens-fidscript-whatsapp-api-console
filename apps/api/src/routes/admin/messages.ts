import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';

const router = Router();
router.use(adminAuth);

// GET /api/admin/messages - paginated inbox messages with raw_payload
router.get('/messages', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = (page - 1) * limit;
    const direction = req.query.direction as string | undefined;
    const instanceId = req.query.instance_id as string | undefined;

    let where = '1=1';
    const params: (string | number)[] = [];
    if (direction) { where += ' AND im.direction = ?'; params.push(direction); }
    if (instanceId) { where += ' AND im.instance_id = ?'; params.push(instanceId); }

    const rows = db.prepare(`
      SELECT im.*, i.name as instance_name
      FROM inbox_messages im
      LEFT JOIN instances i ON im.instance_id = i.id
      WHERE ${where}
      ORDER BY im.timestamp DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM inbox_messages im WHERE ${where}
    `).get(...params) as { count: number };

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: total.count, totalPages: Math.ceil(total.count / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// POST /api/admin/messages/:id/replay - replay raw_payload to instance webhook
router.post('/messages/:id/replay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const msg = db.prepare(`
      SELECT im.*, i.webhook_url, i.name as instance_name
      FROM inbox_messages im
      LEFT JOIN instances i ON im.instance_id = i.id
      WHERE im.id = ?
    `).get(id) as { raw_payload?: string; webhook_url?: string; instance_name?: string } | undefined;

    if (!msg) {
      res.status(404).json({ success: false, error: 'Message not found' });
      return;
    }

    if (!msg.raw_payload) {
      res.status(422).json({ success: false, error: 'No raw_payload stored for this message' });
      return;
    }

    if (!msg.webhook_url) {
      res.status(422).json({ success: false, error: 'Instance has no webhook_url configured' });
      return;
    }

    // Update replay status
    db.prepare('UPDATE inbox_messages SET is_read = 0 WHERE id = ?').run(id);

    // POST raw_payload to the configured webhook_url
    let webhookOk = false;
    let webhookStatus = 0;
    try {
      const payload = JSON.parse(msg.raw_payload);
      const response = await fetch(msg.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      webhookStatus = response.status;
      webhookOk = response.ok;
    } catch (fetchErr) {
      webhookOk = false;
    }

    // Record replay in audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'replay', 'inbox_message', ?, ?)
    `).run(
      `replay_${Date.now()}`,
      (req as { user?: { id: string } }).user?.id || 'admin',
      id,
      JSON.stringify({ webhook_url: msg.webhook_url, webhook_ok: webhookOk, webhook_status: webhookStatus }),
    );

    res.json({
      success: true,
      data: { replayed: webhookOk, webhook_status: webhookStatus },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to replay message' });
  }
});

export default router;