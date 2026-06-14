import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';

const router = Router();
router.use(adminAuth);

// GET /api/admin/instances - List all instances
router.get('/instances', (_req: Request, res: Response) => {
  try {
    const instances = db.prepare(`
      SELECT i.*, c.name as client_name
      FROM instances i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
    `).all();

    res.json({ success: true, data: instances });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch instances' });
  }
});

export default router;