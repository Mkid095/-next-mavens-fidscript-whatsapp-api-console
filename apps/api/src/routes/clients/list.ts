import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';

const router = Router();
router.use(adminAuth);

// GET /api/clients - List all clients
router.get('/', (_req: Request, res: Response) => {
  try {
    const clients = db.prepare(`
      SELECT c.*, p.name as plan_name, p.price_monthly
      FROM clients c
      LEFT JOIN plans p ON c.plan_id = p.id
      ORDER BY c.created_at DESC
    `).all();

    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
});

export default router;