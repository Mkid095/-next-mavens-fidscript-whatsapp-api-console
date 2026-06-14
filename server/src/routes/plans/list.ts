import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';

const router = Router();
router.use(adminAuth);

// GET /api/plans - List all plans
router.get('/', (_req: Request, res: Response) => {
  try {
    const plans = db.prepare('SELECT * FROM plans WHERE is_active = 1 ORDER BY price_monthly ASC').all();
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

export default router;