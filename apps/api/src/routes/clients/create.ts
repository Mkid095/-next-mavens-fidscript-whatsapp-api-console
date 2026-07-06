import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';

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

// POST /api/clients - Create a new client
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, email, phone, plan_id } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    const existing = db.prepare('SELECT id FROM clients WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'A client with this email already exists' });
    }

    if (plan_id) {
      const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND is_active = 1').get(plan_id);
      if (!plan) {
        return res.status(400).json({ success: false, error: 'Invalid plan' });
      }
    }

    const id = `cli_${uuidv4().substring(0, 8)}`;
    const apiKey = generateApiKey();
    const keyHash = bcrypt.hashSync(apiKey, 10);

    db.prepare(`INSERT INTO clients (id, name, email, phone, api_key, key_hash, plan_id) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, name, email, phone || null, apiKey, keyHash, plan_id || null);

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

    logAuditAction(req, 'CREATE', 'client', id, `Created client: ${name} (${email})`);

    res.status(201).json({ success: true, data: client, message: 'Client created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create client' });
  }
});

export default router;