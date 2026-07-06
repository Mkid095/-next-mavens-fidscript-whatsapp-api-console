import { Router, Request, Response } from 'express';
import db from '../../database.js';

const router = Router();

// GET /api/payments/packages - List token packages
router.get('/', (req: Request, res: Response) => {
  try {
    const packages = db.prepare(`
      SELECT * FROM token_packages WHERE is_active = 1 ORDER BY price_kes ASC
    `).all();

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch packages' });
  }
});

// GET /api/payments/packages/:id - Get package details
router.get('/:id', (req: Request, res: Response) => {
  try {
    const pkg = db.prepare('SELECT * FROM token_packages WHERE id = ?').get(req.params.id);

    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch package' });
  }
});

export default router;