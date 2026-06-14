import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../../database.js';
import { generateToken } from '../../middleware/auth.js';
import type { User } from '../../types.js';

const router = Router();

function generateApiKey(): string {
  return `fidscript_live_${crypto.randomBytes(24).toString('hex')}`;
}

// POST /api/auth/client-register - Client signup
router.post('/client-register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const existing = db.prepare('SELECT id FROM clients WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const freePlan = db.prepare("SELECT id FROM plans WHERE name = 'Free' AND is_active = 1").get() as any;
    const defaultPlanId = freePlan?.id || null;

    const clientId = `cli_${uuidv4().substring(0, 8)}`;
    const apiKey = generateApiKey();
    const passwordHash = password ? bcrypt.hashSync(password, 10) : null;

    db.prepare(`
      INSERT INTO clients (id, name, email, phone, password_hash, api_key, plan_id, token_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, 500)
    `).run(clientId, name, email, phone || null, passwordHash, apiKey, defaultPlanId);

    db.prepare(`
      INSERT INTO token_transactions (id, client_id, type, amount, reference, status)
      VALUES (?, ?, 'bonus', 500, 'Welcome bonus', 'completed')
    `).run(uuidv4(), clientId);

    res.status(201).json({
      success: true,
      data: {
        client: { id: clientId, name, email, phone, token_balance: 500, plan_id: defaultPlanId, api_key: apiKey },
        message: 'Account created successfully. You received 500 free tokens!',
      },
    });
  } catch (error) {
    console.error('Client registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// POST /api/auth/client-login - Client portal login
router.post('/client-login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const client = db.prepare('SELECT * FROM clients WHERE email = ?').get(email) as any;

    if (!client) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (client.password_hash) {
      const validPassword = bcrypt.compareSync(password, client.password_hash);
      if (!validPassword) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    } else {
      return res.status(401).json({ success: false, error: 'This account uses social login. Please login with Google.' });
    }

    const token = generateToken({ id: client.id, email: client.email, role: 'client' } as User, 'client');

    res.json({
      success: true,
      data: {
        token,
        client: {
          id: client.id, name: client.name, email: client.email, phone: client.phone,
          token_balance: client.token_balance, plan_id: client.plan_id, api_key: client.api_key,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

export default router;
