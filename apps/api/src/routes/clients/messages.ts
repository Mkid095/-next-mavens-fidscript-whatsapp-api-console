import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import db from '../../database.js';
import { dashboardEmitter } from '../../utils/dashboardEmitter.js';

const router = Router();

// GET /api/client/messages - Get messages for authenticated client
// Optional query: ?instance_name=foo to filter by container
router.get('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { instance_name } = req.query;
    let query = `
      SELECT im.id, im.from_number, im.from_name, im.message_type, im.content,
             im.media_url, im.is_read, im.timestamp, im.direction, i.name as instance_name,
             im.chat_id, im.is_group
      FROM inbox_messages im
      JOIN instances i ON im.instance_id = i.id
      WHERE im.client_id = ?
    `;
    const params: any[] = [req.client!.id];

    if (instance_name) {
      query += ' AND i.name = ?';
      params.push(instance_name);
    }

    query += ' ORDER BY im.timestamp DESC LIMIT 200';

    const messages = db.prepare(query).all(...params);
    res.json({ success: true, data: messages });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Mark message as read
router.patch('/:id/read', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    db.prepare('UPDATE inbox_messages SET is_read = 1 WHERE id = ? AND client_id = ?').run(req.params.id, req.client!.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /api/client/dashboard-stats - Stats for client dashboard
router.get('/dashboard-stats', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const clientId = req.client!.id;
    const today = new Date().toISOString().split('T')[0];

    // Messages sent today
    const todayRow = db.prepare(`
      SELECT COUNT(*) as count FROM inbox_messages
      WHERE client_id = ? AND direction = 'outgoing' AND date(timestamp) = ?
    `).get(clientId, today) as { count: number };

    // Daily volume last 7 days
    const dailyVolume = db.prepare(`
      SELECT
        date(timestamp) as date,
        SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as messages_sent,
        SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as messages_received
      FROM inbox_messages
      WHERE client_id = ? AND timestamp >= datetime('now', '-7 days')
      GROUP BY date(timestamp)
      ORDER BY date ASC
    `).all(clientId) as { date: string; messages_sent: number; messages_received: number }[];

    // Recent messages (last 10)
    const recentMessages = db.prepare(`
      SELECT im.id, im.from_number, im.from_name, im.message_type, im.content,
             im.media_url, im.is_read, im.timestamp, im.direction, i.name as instance_name
      FROM inbox_messages im
      JOIN instances i ON im.instance_id = i.id
      WHERE im.client_id = ?
      ORDER BY im.timestamp DESC
      LIMIT 10
    `).all(clientId);

    res.json({
      success: true,
      data: {
        messagesToday: todayRow.count,
        dailyVolume: dailyVolume.map(d => ({
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          messages_sent: d.messages_sent,
          messages_delivered: d.messages_received,
        })),
        recentMessages,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
