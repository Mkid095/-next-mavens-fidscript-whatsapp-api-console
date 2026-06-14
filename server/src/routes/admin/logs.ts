import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';

const router = Router();
router.use(adminAuth);

// GET /api/admin/logs - Get API request logs
router.get('/logs', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const logs = db.prepare(`
      SELECT l.*, i.name as instance_name, c.name as client_name
      FROM api_logs l
      LEFT JOIN instances i ON l.instance_id = i.id
      LEFT JOIN clients c ON l.client_id = c.id
      ORDER BY l.timestamp DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM api_logs').get() as { count: number };

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

export default router;