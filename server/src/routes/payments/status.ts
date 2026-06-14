import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';
import fetch from 'node-fetch';

const router = Router();

const PAYHERO_API_URL = process.env.PAYHERO_API_URL || 'https://backend.payhero.co.ke/api/v2';
const PAYHERO_BASIC_AUTH = process.env.PAYHERO_BASIC_AUTH || '';

async function payheroRequest(endpoint: string, method: string, body?: object) {
  const response = await fetch(`${PAYHERO_API_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': PAYHERO_BASIC_AUTH,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

// GET /api/payments/status/:reference - Check payment status
router.get('/:reference', async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    const payment = db.prepare(`
      SELECT p.*, tp.tokens, tp.bonus_tokens
      FROM payments p
      LEFT JOIN token_packages tp ON p.package_id = tp.id
      WHERE p.payhero_reference = ? OR p.checkout_request_id = ?
    `).get(reference, reference) as any;

    if (payment) {
      return res.json({
        success: true,
        data: {
          status: payment.status,
          amount: payment.amount_kes,
          tokens: payment.tokens + payment.bonus_tokens,
          created_at: payment.created_at,
        },
      });
    }

    const payheroResponse: any = await payheroRequest(
      `/transaction-status?reference=${reference}`,
      'GET'
    );

    res.json({
      success: true,
      data: {
        status: payheroResponse.status,
        provider: payheroResponse.provider,
        transaction_date: payheroResponse.transaction_date,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check payment status' });
  }
});

// GET /api/payments/history/:clientId - Get client's payment history
router.get('/history/:clientId', adminAuth, (req: Request, res: Response) => {
  try {
    const payments = db.prepare(`
      SELECT p.*, tp.name as package_name, tp.tokens, tp.bonus_tokens
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

// GET /api/payments/wallet-balance - Get Pay Hero wallet balance
router.get('/wallet-balance', adminAuth, async (req: Request, res: Response) => {
  try {
    const balance: any = await payheroRequest('/payments_wallet_balance', 'GET');
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch wallet balance' });
  }
});

export default router;