import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import listRouter from './list.js';
import createRouter from './create.js';
import getRouter from './get.js';
import manageRouter from './manage.js';
import deleteRouter from './delete.js';
import db from '../../database.js';

const router = Router();

// TEMP: hardcoded magic code for Tuma live testing — no email, remove after go-live
// POST /api/clients/tuma-test/ready
router.post('/tuma-test/ready', (req: Request, res: Response) => {
  try {
    const email = 'nextmavensoffice@gmail.com';
    const name = 'Next Mavens';
    const phone = '254700000000';

    // Create client if doesn't exist
    const existing = db.prepare('SELECT id FROM clients WHERE email = ?').get(email) as { id: string } | undefined;
    let clientId: string;
    if (existing) {
      clientId = existing.id;
    } else {
      clientId = 'cli_tuma' + uuidv4().substring(0, 8);
      const apiKey = 'fidscript_live_' + crypto.randomBytes(24).toString('hex');
      db.prepare(
        `INSERT INTO clients (id, name, email, phone, password_hash, api_key, plan_id, token_balance, created_at) VALUES (?, ?, ?, ?, NULL, ?, NULL, 500, CURRENT_TIMESTAMP)`
      ).run(clientId, name, email, phone, apiKey);
    }

    // Insert hardcoded magic code directly — bypass email
    const code = '111111';
    const codeHash = bcrypt.hashSync(code, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    db.prepare(
      `INSERT INTO auth_codes (id, email, code_hash, purpose, attempts, expires_at) VALUES (?, ?, ?, 'login', 0, ?)`
    ).run(uuidv4(), email, codeHash, expiresAt);

    res.json({
      success: true,
      data: {
        client_id: clientId,
        email,
        phone,
        magic_code: code,
        note: 'Hardcoded — remove /tuma-test/ready route after Tuma go-live'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.use('/', listRouter);
router.use('/', createRouter);
router.use('/', getRouter);
router.use('/', manageRouter);
router.use('/', deleteRouter);

export default router;
