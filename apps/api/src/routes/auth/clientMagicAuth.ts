import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../../database.js';
import { generateToken } from '../../middleware/auth.js';
import { createAuthCode, consumeAuthCode } from '../../utils/authCodes.js';
import { sendMagicCodeEmail } from '../../utils/sendMagicCodeEmail.js';
import type { User } from '../../types.js';

const router = Router();

function generateApiKey(): string {
  return `fidscript_live_${crypto.randomBytes(24).toString('hex')}`;
}

interface ClientRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  token_balance: number;
  plan_id: string | null;
  api_key: string;
}

// POST /api/auth/client/request-code — start passwordless sign-up
router.post('/client/request-code', async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Name, email, and phone are required' });
    }
    const normalized = email.trim().toLowerCase();

    const existing = db.prepare('SELECT id FROM clients WHERE email = ?').get(normalized);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists. Sign in instead.' });
    }

    const code = createAuthCode(normalized, 'register');
    if (!code) {
      return res.status(429).json({
        success: false,
        error: 'Too many verification codes requested. Please wait 5 minutes and try again.',
        code: 'RATE_LIMITED',
      });
    }

    const sent = await sendMagicCodeEmail(normalized, code, 'register');
    if (!sent.success) {
      console.error('[client/request-code] email send failed:', sent.error);
      return res.status(500).json({ success: false, error: sent.error || 'Failed to send code' });
    }

    return res.json({ success: true, data: { message: 'Verification code sent to your email.' } });
  } catch (err) {
    console.error('[client/request-code] INTERNAL ERROR:', err);
    return res.status(500).json({
      success: false,
      error: 'Could not send code. Please try again.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

// POST /api/auth/client/verify-code — verify the code and create the account
router.post('/client/verify-code', (req: Request, res: Response) => {
  try {
  const { name, email, phone, code } = req.body;
  if (!name || !email || !phone || !code) {
    return res.status(400).json({ success: false, error: 'Name, email, phone, and code are required' });
  }
  const normalized = email.trim().toLowerCase();

  if (!consumeAuthCode(normalized, String(code), 'register')) {
    return res.status(401).json({ success: false, error: 'Invalid or expired code' });
  }

  const existing = db.prepare('SELECT * FROM clients WHERE email = ?').get(normalized) as (ClientRow & { is_active: number }) | undefined;

  if (existing) {
    // Existing client — issue a login JWT
    if (!existing.is_active) {
      return res.status(403).json({ success: false, error: 'Account is disabled. Contact support.' });
    }
    const token = generateToken({ id: existing.id, email: existing.email, name: existing.name, role: 'client' } as User, 'client');
    return res.json({
      success: true,
      data: {
        token,
        role: 'client',
        client: { id: existing.id, name: existing.name, email: existing.email, phone: existing.phone, token_balance: existing.token_balance, plan_id: existing.plan_id, api_key: existing.api_key },
        message: 'Welcome back!',
      },
    });
  }

  // New client — create account
  const freePlan = db.prepare("SELECT id FROM plans WHERE name = 'Free' AND is_active = 1").get() as { id: string } | undefined;
  const defaultPlanId = freePlan?.id || null;

  const clientId = `cli_${uuidv4().substring(0, 8)}`;
  const apiKey = generateApiKey();

  db.prepare(`
    INSERT INTO clients (id, name, email, phone, key_hash, api_key, plan_id, token_balance)
    VALUES (?, ?, ?, ?, NULL, ?, ?, 500)
  `).run(clientId, name, normalized, phone, apiKey, defaultPlanId);

  db.prepare(`
    INSERT INTO token_transactions (id, client_id, type, amount, reference, status)
    VALUES (?, ?, 'bonus', 500, 'Welcome bonus', 'completed')
  `).run(uuidv4(), clientId);

  const token = generateToken({ id: clientId, email: normalized, name: name, role: 'client' } as User, 'client');

  const client: ClientRow = {
    id: clientId,
    name,
    email: normalized,
    phone,
    token_balance: 500,
    plan_id: defaultPlanId,
    api_key: apiKey,
  };

  return res.status(201).json({
    success: true,
    data: {
      token,
      client,
      message: 'Account created successfully! You received 500 free tokens to get started.',
    },
  });
  } catch (err) {
    console.error('[client/verify-code] INTERNAL ERROR:', err);
    return res.status(500).json({
      success: false,
      error: 'Account creation failed. Please try again or contact support.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
