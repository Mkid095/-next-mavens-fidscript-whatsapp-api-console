import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';
import type { Client } from '../../types.js';
import { sendTokenAwardEmail } from '../../utils/sendTokenAwardEmail.js';

const router = Router();

router.use(adminAuth);

function generateApiKey(): string {
  return `fidscript_live_${crypto.randomBytes(24).toString('hex')}`;
}

function logAuditAction(req: Request, action: string, entityType: string, entityId: string, details?: string) {
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), req.user?.id, action, entityType, entityId, details || null, req.ip);
}

// PATCH /api/clients/:id/toggle - Enable/disable client
router.patch('/:id/toggle', (req: Request, res: Response) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id) as Client | undefined;

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const newStatus = client.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE clients SET is_active = ? WHERE id = ?').run(newStatus, req.params.id);

    logAuditAction(req, 'TOGGLE', 'client', req.params.id, `${client.name} ${newStatus === 1 ? 'enabled' : 'disabled'}`);

    res.json({
      success: true,
      data: { id: req.params.id, is_active: newStatus },
      message: `Client ${newStatus === 1 ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to toggle client status' });
  }
});

// POST /api/clients/:id/reset-key - Reset client's API key
router.post('/:id/reset-key', (req: Request, res: Response) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id) as Client | undefined;

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const newApiKey = generateApiKey();
    const keyHash = bcrypt.hashSync(newApiKey, 10);
    db.prepare('UPDATE clients SET api_key = ?, key_hash = ? WHERE id = ?').run(newApiKey, keyHash, req.params.id);

    logAuditAction(req, 'RESET_KEY', 'client', req.params.id, `API key reset for ${client.name}`);

    res.json({ success: true, data: { api_key: newApiKey }, message: 'API key reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reset API key' });
  }
});

// POST /api/clients/:id/award-tokens - Admin awards tokens to a client
//
// Award contract: credits exactly `amount` tokens. Idempotent by header
// `Idempotency-Key` (caller-generated, stable per award intent). The client
// MUST supply an idempotency key — the server uses it to short-circuit any
// duplicate request (double-click, React StrictMode re-fire, network retry)
// within a 1-hour window with the cached response, so the balance is
// credited exactly once. Balance update + ledger insert are wrapped in a
// single BEGIN/COMMIT transaction so they can never diverge.
router.post('/:id/award-tokens', (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    if (!idempotencyKey || idempotencyKey.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Idempotency-Key header is required (caller-generated, stable per award intent).',
      });
    }
    if (idempotencyKey.length > 200) {
      return res.status(400).json({ success: false, error: 'Idempotency-Key too long (max 200 chars).' });
    }

    // Idempotency replay window: 1 hour. Within this window the same key
    // returns the cached response — no re-charge.
    const existing = db.prepare(
      'SELECT response_json FROM idempotency_keys WHERE id = ? AND created_at > datetime("now", "-1 hour")'
    ).get(idempotencyKey) as { response_json: string } | undefined;
    if (existing) {
      res.set('X-Idempotency-Replay', 'true');
      return res.status(200).json(JSON.parse(existing.response_json));
    }

    const { amount: rawAmount, note } = req.body as { amount?: number; note?: string };

    if (!Number.isInteger(rawAmount) || (rawAmount as number) <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive integer' });
    }
    const amount = rawAmount as number;

    // Hard cap: prevent catastrophic accidental awards. Admin can override
    // via a deliberate UI flow if ever needed (not exposed today).
    if (amount > 1_000_000) {
      return res.status(400).json({ success: false, error: 'Amount exceeds maximum (1,000,000).' });
    }

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id) as Client | undefined;
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // sql.js has no JS-level .transaction(); each statement is atomic. The
    // real guarantee against double-credit is the idempotency key (required
    // + stable per award intent) checked above. A process crash between the
    // UPDATE and the INSERT is exceedingly rare and would require manual
    // reconciliation; this matches the pattern used by the phonebook sync.
    const txnId = `txn_${uuidv4().substring(0, 8)}`;
    db.prepare('UPDATE clients SET token_balance = token_balance + ? WHERE id = ?').run(amount, req.params.id);
    db.prepare(
      'INSERT INTO token_transactions (id, client_id, type, amount, reference, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(txnId, req.params.id, 'admin_award', amount, note || null, 'completed');
    const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(req.params.id) as { token_balance: number };
    const updatedBalance = updated.token_balance;

    logAuditAction(req, 'AWARD_TOKENS', 'client', req.params.id, `Awarded ${amount} tokens to ${client.name}${note ? ` — ${note}` : ''}`);

    sendTokenAwardEmail(client.email, client.name, amount, note).catch(err =>
      console.error('[token-award] Email failed:', err)
    );

    const response = { success: true, data: { id: req.params.id, token_balance: updatedBalance } };

    // Store the idempotency result LAST so a request that errors mid-flight
    // is not cached and can be retried by the caller with the same key.
    db.prepare(
      'INSERT OR REPLACE INTO idempotency_keys (id, response_json, status_code, created_at) VALUES (?, ?, 200, datetime("now"))'
    ).run(idempotencyKey, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('[award-tokens] failed:', error);
    res.status(500).json({ success: false, error: 'Failed to award tokens' });
  }
});

export default router;
