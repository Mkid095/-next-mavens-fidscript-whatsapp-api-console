import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { emitTokenUpdate } from '../../utils/paymentEmitter.js';

const router = Router();

// POST /api/payments/callback - Tuma API callback
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      payment_id: tumaPaymentId,
      status,
      merchant_request_id,
      checkout_request_id,
      result_code,
      mpesa_receipt_number,
      amount,
      result_desc,
      failure_reason,
    } = req.body;

    console.log(`[callback] raw body:`, JSON.stringify(req.body));

    if (!merchant_request_id && !checkout_request_id && !tumaPaymentId) {
      return res.status(400).json({ success: false, error: 'Missing request IDs' });
    }

    // Find payment: try merchant_request_id, checkout_request_id, AND our internal payment_id
    const payment = db.prepare(
      'SELECT * FROM payments WHERE payhero_reference = ? OR checkout_request_id = ? OR id = ? LIMIT 1'
    ).get(merchant_request_id || checkout_request_id, checkout_request_id || merchant_request_id, tumaPaymentId) as any;

    console.log(`[callback] lookup by merchant="${merchant_request_id}" checkout="${checkout_request_id}" tumaId="${tumaPaymentId}" => payment=${payment ? 'FOUND id=' + payment.id + ' status=' + payment.status : 'NOT FOUND'}`);

    if (!payment) {
      return res.status(200).json({ received: true });
    }

    if (payment.status === 'completed') {
      return res.status(200).json({ received: true, message: 'Already processed' });
    }

    const client_id = payment.client_id;
    const our_payment_id = payment.id;

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

      console.log(`[callback] processing success: payment_id=${our_payment_id} tokens=${totalTokens} result_code=${result_code} status=${status}`);

      if (totalTokens > 0) {
        db.prepare('UPDATE clients SET token_balance = token_balance + ? WHERE id = ?').run(totalTokens, client_id);

        db.prepare(`
          INSERT INTO token_transactions (id, client_id, type, amount, reference, mpesa_receipt, status)
          VALUES (?, ?, 'purchase', ?, ?, ?, 'completed')
        `).run(uuidv4(), client_id, totalTokens, merchant_request_id, mpesa_receipt_number || null);

        db.prepare('UPDATE payments SET status = ?, token_count = ? WHERE id = ?').run('completed', totalTokens, our_payment_id);

        // Emit SSE token update to the client
        const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(client_id) as { token_balance: number } | undefined;
        if (updated) {
          emitTokenUpdate(client_id, {
            balance: updated.token_balance,
            transaction_id: our_payment_id,
            mpesa_receipt: mpesa_receipt_number,
          });
        }
      }
    } else {
      // Failure
      console.log(`[callback] processing failure: payment_id=${our_payment_id} result_code=${result_code} status=${status} reason=${failure_reason}`);
      db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('failed', our_payment_id);

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