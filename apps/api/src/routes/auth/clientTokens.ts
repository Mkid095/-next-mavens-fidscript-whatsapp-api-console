import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../database.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fidscript-secret-key-change-in-production';

// GET /api/auth/client/tokens - Get client's token balance and history
router.get('/client/tokens', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization required',
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; type: string; email: string };

    const client = db.prepare('SELECT id, token_balance FROM clients WHERE id = ?').get(decoded.id) as any;

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    const history = db.prepare(`
      SELECT * FROM token_transactions
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(decoded.id);

    res.json({
      success: true,
      data: {
        balance: client.token_balance,
        history,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
});

export default router;