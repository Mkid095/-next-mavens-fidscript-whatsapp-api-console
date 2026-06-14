import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import { tumaRequest } from '../../utils/tumaAuth.js';

const router = Router();

const PLATFORM_URL = process.env.PLATFORM_URL || 'https://whatsapp.fidscript.com';
const PER_TOKEN_RATE = 0.11;

// POST /api/payments/custom - Buy custom token amount at KES 0.11/token via Tuma
router.post('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { tokens, phone_number } = req.body;
    const client_id = req.client?.id;

    if (!tokens || !phone_number) {
      return res.status(400).json({ success: false, error: 'tokens and phone_number are required' });
    }

    const tokenCount = Number(tokens);
    if (tokenCount < 1 || tokenCount > 999999) {
      return res.status(400).json({ success: false, error: 'Invalid token amount' });
    }

    const amountKsh = Math.ceil(tokenCount * PER_TOKEN_RATE);

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
      VALUES (?, ?, NULL, ?, ?, 'pending')
    `).run(payment_id, client_id, amountKsh, formattedPhone);

    const callback_url = `${PLATFORM_URL}/api/payments/callback`;
    const description = `Custom token purchase: ${tokenCount.toLocaleString()} tokens`;

    const tumaRes: any = await tumaRequest('/payment/stk-push', 'POST', {
      amount: amountKsh,
      phone: formattedPhone,
      callback_url,
      description,
    });

    if (tumaRes.success && tumaRes.data) {
      db.prepare(`
        UPDATE payments SET
          payhero_reference = ?,
          checkout_request_id = ?,
          status = 'processing'
        WHERE id = ?
      `).run(tumaRes.data.merchant_request_id, tumaRes.data.checkout_request_id, payment_id);
    }

    res.json({
      success: true,
      data: {
        payment_id,
        reference: tumaRes.data?.merchant_request_id,
        checkout_request_id: tumaRes.data?.checkout_request_id,
        status: tumaRes.message,
        amount: amountKsh,
        tokens: tokenCount,
        rate: PER_TOKEN_RATE,
      },
    });
  } catch (error) {
    console.error('Custom payment initiate error:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate payment' });
  }
});

export default router;
