import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import { tumaRequest } from '../../utils/tumaAuth.js';

const router = Router();

const PLATFORM_URL = process.env.PLATFORM_URL || 'https://whatsapp.fidscript.com';

// POST /api/payments/initiate - Initiate M-Pesa STK push via Tuma
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
    const description = `Token purchase: ${pkg.name} — ${pkg.tokens.toLocaleString()} tokens`;

    const tumaRes: any = await tumaRequest('/payment/stk-push', 'POST', {
      amount: Math.round(pkg.price_kes),
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
        amount: pkg.price_kes,
        tokens: pkg.tokens + pkg.bonus_tokens,
      },
    });
  } catch (error) {
    console.error('Tuma initiate error:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate payment' });
  }
});

export default router;