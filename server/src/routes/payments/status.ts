import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { adminAuth, clientJwtAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/payments/status/:reference - Check payment status by reference
router.get('/:reference', async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    const payment = db.prepare(`
      SELECT p.*, tp.tokens, tp.bonus_tokens
      FROM payments p
      LEFT JOIN token_packages tp ON p.package_id = tp.id
      WHERE p.payhero_reference = ? OR p.checkout_request_id = ? OR p.id = ?
    `).get(reference, reference, reference) as any;

    if (!payment) {
      const recent = (db.prepare('SELECT id, payhero_reference, checkout_request_id, status FROM payments ORDER BY created_at DESC LIMIT 5').all() as any[]);
      console.error(`[paymentStatus] ref="${reference}" not found. Recent:`, JSON.stringify(recent));
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    return res.json({
      success: true,
      data: {
        status: payment.status,
        amount: payment.amount_kes,
        tokens: (payment.token_count ?? 0) + (payment.bonus_tokens ?? 0),
        created_at: payment.created_at,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check payment status' });
  }
});

// GET /api/payments/client/history - Get own payment history (client JWT auth)
router.get('/client/history', clientJwtAuth, (req: Request, res: Response) => {
  try {
    const payments = db.prepare(`
      SELECT p.id, p.client_id, p.package_id, p.amount_kes, p.phone_number,
             p.payhero_reference, p.checkout_request_id, p.status, p.token_count,
             p.created_at, tp.name as package_name,
             COALESCE(p.token_count, tp.tokens + tp.bonus_tokens) as tokens,
             tp.bonus_tokens
      FROM payments p
      LEFT JOIN token_packages tp ON p.package_id = tp.id
      WHERE p.client_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all(req.client?.id);

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payment history' });
  }
});

// GET /api/payments/history/:clientId - Get client's payment history (admin only)
router.get('/history/:clientId', adminAuth, (req: Request, res: Response) => {
  try {
    const payments = db.prepare(`
      SELECT p.id, p.client_id, p.package_id, p.amount_kes, p.phone_number,
             p.payhero_reference, p.checkout_request_id, p.status, p.token_count,
             p.created_at, tp.name as package_name,
             COALESCE(p.token_count, tp.tokens + tp.bonus_tokens) as tokens,
             tp.bonus_tokens
      FROM payments p
      LEFT JOIN token_packages tp ON p.package_id = tp.id
      WHERE p.client_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all(req.params.clientId);

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payment history' });
  }
});

export default router;