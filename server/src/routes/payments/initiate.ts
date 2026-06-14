import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import fetch from 'node-fetch';

const router = Router();

const PAYHERO_API_URL = process.env.PAYHERO_API_URL || 'https://backend.payhero.co.ke/api/v2';
const PAYHERO_BASIC_AUTH = process.env.PAYHERO_BASIC_AUTH || '';
const PAYHERO_CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID || '7722';
const PLATFORM_URL = process.env.PLATFORM_URL || 'https://whatsapp.fidscript.com';

// Helper: Call Pay Hero API
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

// POST /api/payments/initiate - Initiate M-Pesa payment
router.post('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { package_id, phone_number } = req.body;
    const client_id = req.client?.id;

    if (!package_id || !phone_number) {
      return res.status(400).json({
        success: false,
        error: 'package_id and phone_number are required',
      });
    }

    const pkg = db.prepare('SELECT * FROM token_packages WHERE id = ? AND is_active = 1').get(package_id) as any;
    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    let formattedPhone = phone_number.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    const payment_id = `pay_${uuidv4().substring(0, 8)}`;
    const external_reference = `TOKEN_BUY_${client_id}_REF_${payment_id}`;

    db.prepare(`
      INSERT INTO payments (id, client_id, package_id, amount_kes, phone_number, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(payment_id, client_id, package_id, pkg.price_kes, formattedPhone);

    const callback_url = `${PLATFORM_URL}/api/payments/callback`;

    const payheroResponse: any = await payheroRequest('/payments', 'POST', {
      amount: Math.round(pkg.price_kes),
      phone_number: formattedPhone,
      channel_id: parseInt(PAYHERO_CHANNEL_ID),
      provider: 'm-pesa',
      external_reference,
      callback_url,
    });

    if (payheroResponse.success) {
      db.prepare(`
        UPDATE payments SET
          payhero_reference = ?,
          checkout_request_id = ?,
          status = 'processing'
        WHERE id = ?
      `).run(payheroResponse.reference, payheroResponse.CheckoutRequestID, payment_id);
    }

    res.json({
      success: true,
      data: {
        payment_id,
        reference: payheroResponse.reference,
        checkout_request_id: payheroResponse.CheckoutRequestID,
        status: payheroResponse.status,
        amount: pkg.price_kes,
        tokens: pkg.tokens + pkg.bonus_tokens,
      },
    });
  } catch (error) {
    console.error('Pay Hero initiate error:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate payment' });
  }
});

export default router;