import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';

const router = Router();
router.use(adminAuth);

// GET /api/clients/:id - Get client details
router.get('/:id', (req: Request, res: Response) => {
  try {
    const client = db.prepare(`
      SELECT c.*, p.name as plan_name, p.price_monthly, p.max_instances, p.msg_per_min
      FROM clients c
      LEFT JOIN plans p ON c.plan_id = p.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const instances = db.prepare('SELECT * FROM instances WHERE client_id = ? ORDER BY created_at DESC').all(req.params.id);

    res.json({ success: true, data: { ...client, instances } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch client' });
  }
});

export default router;