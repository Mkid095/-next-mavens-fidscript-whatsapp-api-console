import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { emitTokenUpdate } from '../../utils/paymentEmitter.js';

const router = Router();

// POST /api/payments/callback - Tuma API callback
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      merchant_request_id,
      checkout_request_id,
      result_code,
      mpesa_receipt_number,
      amount,
      result_desc,
      failure_reason,
    } = req.body;

    if (!merchant_request_id && !checkout_request_id) {
      return res.status(400).json({ success: false, error: 'Missing request IDs' });
    }

    // Find payment by merchant_request_id (our external_reference stored as payhero_reference)
    const payment = db.prepare(
      'SELECT * FROM payments WHERE payhero_reference = ? OR checkout_request_id = ? LIMIT 1'
    ).get(merchant_request_id || checkout_request_id, checkout_request_id) as any;

    if (!payment) {
      console.error('Payment not found for callback:', merchant_request_id, checkout_request_id);
      return res.status(200).json({ received: true });
    }

    if (payment.status === 'completed') {
      return res.status(200).json({ received: true, message: 'Already processed' });
    }

    const client_id = payment.client_id;
    const payment_id = payment.id;

    if (result_code === 0 || status === 'completed') {
      // Success
      const pkg = db.prepare('SELECT * FROM token_packages WHERE id = ?').get(payment.package_id) as any;

      let totalTokens = 0;
      if (pkg) {
        totalTokens = pkg.tokens + pkg.bonus_tokens;
      } else {
        // Custom purchase: tokens = amount_kes / 0.11
        totalTokens = Math.round((payment.amount_kes || 0) / 0.11);
      }

      if (totalTokens > 0) {
        db.prepare('UPDATE clients SET token_balance = token_balance + ? WHERE id = ?').run(totalTokens, client_id);

        db.prepare(`
          INSERT INTO token_transactions (id, client_id, type, amount, reference, mpesa_receipt, status)
          VALUES (?, ?, 'purchase', ?, ?, ?, 'completed')
        `).run(uuidv4(), client_id, totalTokens, merchant_request_id, mpesa_receipt_number || null);

        db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('completed', payment_id);

        // Emit SSE token update to the client
        const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(client_id) as { token_balance: number } | undefined;
        if (updated) {
          emitTokenUpdate(client_id, {
            balance: updated.token_balance,
            transaction_id: payment_id,
            mpesa_receipt: mpesa_receipt_number,
          });
        }
      }
    } else {
      // Failure
      db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('failed', payment_id);

      db.prepare(`
        INSERT INTO token_transactions (id, client_id, type, amount, reference, status)
        VALUES (?, ?, 'failed', 0, ?, 'failed')
      `).run(uuidv4(), client_id, merchant_request_id);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Tuma callback error:', error);
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

export default router;