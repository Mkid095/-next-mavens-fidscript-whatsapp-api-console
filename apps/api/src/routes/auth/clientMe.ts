import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../database.js';

const router = Router();

// GET /api/auth/client/me - Get current client
router.get('/client/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization required' });
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'fidscript-secret-key-change-in-production';

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; type: string; email: string };

    if (decoded.type !== 'client') {
      return res.status(401).json({ success: false, error: 'Invalid token type' });
    }

    const client = db.prepare(`
      SELECT c.id, c.name, c.email, c.phone, c.token_balance, c.plan_id, c.api_key,
             c.is_active, c.created_at, p.name as plan_name
      FROM clients c
      LEFT JOIN plans p ON c.plan_id = p.id
      WHERE c.id = ?
    `).get(decoded.id) as any;

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const tokenHistory = db.prepare(`
      SELECT * FROM token_transactions WHERE client_id = ? ORDER BY created_at DESC LIMIT 10
    `).all(decoded.id);

    res.json({ success: true, data: { ...client, token_history: tokenHistory } });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
});

export default router;
