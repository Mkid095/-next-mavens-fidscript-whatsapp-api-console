import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import fetch from 'node-fetch';
import { emitTokenUpdate } from '../../utils/paymentEmitter.js';

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

// POST /api/payments/callback - Pay Hero callback URL
router.post('/', async (req: Request, res: Response) => {
  try {
    const { response, status } = req.body;
    const { ExternalReference, ResultCode, MpesaReceiptNumber, Amount } = response || {};

    if (!ExternalReference) {
      return res.status(400).json({ success: false, error: 'Missing external reference' });
    }

    const match = ExternalReference.match(/TOKEN_BUY_(.+?)_REF_(.+)/);
    if (!match) {
      console.error('Invalid external reference format:', ExternalReference);
      return res.status(200).json({ received: true });
    }

    const [, client_id, payment_id] = match;

    const existingPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id) as any;
    if (!existingPayment || existingPayment.status === 'completed') {
      return res.status(200).json({ received: true, message: 'Payment already processed' });
    }

    if (ResultCode === 0 && status) {
      const pkg = db.prepare('SELECT * FROM token_packages WHERE id = ?').get(existingPayment.package_id) as any;

      let totalTokens = 0;
      if (pkg) {
        totalTokens = pkg.tokens + pkg.bonus_tokens;
      } else {
        // Custom purchase: tokens = amount_kes / 0.11
        totalTokens = Math.round((existingPayment.amount_kes || 0) / 0.11);
      }

      if (totalTokens > 0) {
        db.prepare(`
          UPDATE clients SET token_balance = token_balance + ? WHERE id = ?
        `).run(totalTokens, client_id);

        db.prepare(`
          INSERT INTO token_transactions (id, client_id, type, amount, reference, mpesa_receipt, status)
          VALUES (?, ?, 'purchase', ?, ?, ?, 'completed')
        `).run(uuidv4(), client_id, totalTokens, ExternalReference, MpesaReceiptNumber);

        db.prepare(`
          UPDATE payments SET status = 'completed' WHERE id = ?
        `).run(payment_id);

        // Fetch updated balance and emit SSE to all connected client sessions
        const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(client_id) as { token_balance: number } | undefined;
        if (updated) {
          emitTokenUpdate(client_id, {
            balance: updated.token_balance,
            transaction_id: payment_id,
            mpesa_receipt: MpesaReceiptNumber,
          });
        }
      }
    } else {
      db.prepare(`UPDATE payments SET status = 'failed' WHERE id = ?`).run(payment_id);

      db.prepare(`
        INSERT INTO token_transactions (id, client_id, type, amount, reference, status)
        VALUES (?, ?, 'failed', 0, ?, 'failed')
      `).run(uuidv4(), client_id, ExternalReference);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Pay Hero callback error:', error);
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

export default router;