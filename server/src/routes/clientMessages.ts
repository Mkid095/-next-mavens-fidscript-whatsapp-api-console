import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../middleware/auth.js';
import db from '../database.js';

const router = Router();

// Get messages for authenticated client
router.get('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const messages = db.prepare(`
      SELECT im.id, im.from_number, im.from_name, im.message_type, im.content,
             im.media_url, im.is_read, im.timestamp, i.name as instance_name
      FROM inbox_messages im
      JOIN instances i ON im.instance_id = i.id
      WHERE im.client_id = ?
      ORDER BY im.timestamp DESC
      LIMIT 100
    `).all(req.client!.id);
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
