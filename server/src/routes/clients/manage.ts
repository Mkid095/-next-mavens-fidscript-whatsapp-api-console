import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';
import type { Client } from '../../types.js';

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
    db.prepare('UPDATE clients SET api_key = ? WHERE id = ?').run(newApiKey, req.params.id);

    logAuditAction(req, 'RESET_KEY', 'client', req.params.id, `API key reset for ${client.name}`);

    res.json({ success: true, data: { api_key: newApiKey }, message: 'API key reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reset API key' });
  }
});

export default router;