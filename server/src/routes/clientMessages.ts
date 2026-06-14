import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../middleware/auth.js';
import db from '../database.js';

const router = Router();

// GET /api/client/messages - Get messages for authenticated client
// Optional query: ?instance_name=foo to filter by container
router.get('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { instance_name } = req.query;
    let query = `
      SELECT im.id, im.from_number, im.from_name, im.message_type, im.content,
             im.media_url, im.is_read, im.timestamp, im.direction, i.name as instance_name
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

export default router;
