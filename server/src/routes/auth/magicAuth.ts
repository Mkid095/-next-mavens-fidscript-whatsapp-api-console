import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { generateToken } from '../../middleware/auth.js';
import { createAuthCode, consumeAuthCode } from '../../utils/authCodes.js';
import { sendMagicCodeEmail } from '../../utils/sendMagicCodeEmail.js';
import type { User } from '../../types.js';

const router = Router();

interface AdminRow {
  id: string;
  email: string;
  name: string;
  role: string;
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

const GENERIC_SENT = 'If an account exists for that email, a verification code was sent.';

// POST /api/auth/request-code — start a passwordless sign-in
router.post('/request-code', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  const normalized = email.trim().toLowerCase();

  const admin = db.prepare('SELECT id, email, name, role FROM users WHERE email = ?').get(normalized) as AdminRow | undefined;
  const client = admin
    ? undefined
    : (db.prepare('SELECT id, name, email, phone, token_balance, plan_id, api_key FROM clients WHERE email = ?').get(normalized) as ClientRow | undefined);

  if (admin || client) {
    const code = createAuthCode(normalized, 'login');
    if (code) {
      const sent = await sendMagicCodeEmail(normalized, code, 'login');
      if (!sent.success) {
        return res.status(500).json({ success: false, error: sent.error || 'Failed to send code' });
      }
    }
  }

  // Always return success to avoid account enumeration.
  return res.json({ success: true, data: { message: GENERIC_SENT } });
});

// POST /api/auth/verify-code — verify the code and issue a JWT
router.post('/verify-code', (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: 'Email and code are required' });
  }
  const normalized = email.trim().toLowerCase();

  if (!consumeAuthCode(normalized, String(code), 'login')) {
    return res.status(401).json({ success: false, error: 'Invalid or expired code' });
  }

  const admin = db.prepare('SELECT id, email, name, role FROM users WHERE email = ?').get(normalized) as AdminRow | undefined;
  if (admin) {
    const token = generateToken({ id: admin.id, email: admin.email, name: admin.name, role: 'admin' } as User, 'admin');
    return res.json({
      success: true,
      data: { token, role: 'admin', user: { id: admin.id, email: admin.email, name: admin.name } },
    });
  }

  const client = db.prepare('SELECT id, name, email, phone, token_balance, plan_id, api_key FROM clients WHERE email = ?').get(normalized) as ClientRow | undefined;
  if (client) {
    const token = generateToken({ id: client.id, email: client.email, name: client.name, role: 'client' } as User, 'client');
    return res.json({
      success: true,
      data: {
        token,
        role: 'client',
        client: { id: client.id, name: client.name, email: client.email, phone: client.phone, token_balance: client.token_balance, plan_id: client.plan_id, api_key: client.api_key },
      },
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid or expired code' });
});

export default router;
