import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../database.js';
import { adminAuth } from '../middleware/auth.js';
import type { Client, Plan } from '../types.js';

const router = Router();

// Apply admin auth to all routes
router.use(adminAuth);

// Generate a new API key
function generateApiKey(): string {
  return `fidscript_live_${crypto.randomBytes(24).toString('hex')}`;
}

// Log admin action
function logAuditAction(req: Request, action: string, entityType: string, entityId: string, details?: string) {
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), req.user?.id, action, entityType, entityId, details || null, req.ip);
}

// GET /api/clients - List all clients
router.get('/', (req: Request, res: Response) => {
  try {
    const clients = db.prepare(`
      SELECT c.*, p.name as plan_name, p.price_monthly
      FROM clients c
      LEFT JOIN plans p ON c.plan_id = p.id
      ORDER BY c.created_at DESC
    `).all();

    res.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
});

// POST /api/clients - Create a new client
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, email, phone, plan_id } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required',
      });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM clients WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A client with this email already exists',
      });
    }

    // Verify plan exists
    if (plan_id) {
      const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND is_active = 1').get(plan_id);
      if (!plan) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plan',
        });
      }
    }

    const id = `cli_${uuidv4().substring(0, 8)}`;
    const apiKey = generateApiKey();

    db.prepare(`
      INSERT INTO clients (id, name, email, phone, api_key, plan_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, email, phone || null, apiKey, plan_id || null);

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

    logAuditAction(req, 'CREATE', 'client', id, `Created client: ${name} (${email})`);

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create client' });
  }
});

// GET /api/clients/:id - Get client details
router.get('/:id', (req: Request, res: Response) => {
  try {
    const client = db.prepare(`
      SELECT c.*, p.name as plan_name, p.price_monthly, p.max_instances, p.msg_per_min
      FROM clients c
      LEFT JOIN plans p ON c.plan_id = p.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    // Get client's instances
    const instances = db.prepare(`
      SELECT * FROM instances WHERE client_id = ?
      ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({
      success: true,
      data: { ...client, instances },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch client' });
  }
});

// PATCH /api/clients/:id/toggle - Enable/disable client
router.patch('/:id/toggle', (req: Request, res: Response) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id) as Client | undefined;

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    const newStatus = client.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE clients SET is_active = ? WHERE id = ?').run(newStatus, req.params.id);

    logAuditAction(
      req,
      'TOGGLE',
      'client',
      req.params.id,
      `${client.name} ${newStatus === 1 ? 'enabled' : 'disabled'}`
    );

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
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    const newApiKey = generateApiKey();
    db.prepare('UPDATE clients SET api_key = ? WHERE id = ?').run(newApiKey, req.params.id);

    logAuditAction(req, 'RESET_KEY', 'client', req.params.id, `API key reset for ${client.name}`);

    res.json({
      success: true,
      data: { api_key: newApiKey },
      message: 'API key reset successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reset API key' });
  }
});

// DELETE /api/clients/:id - Remove client
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id) as Client | undefined;

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    // Delete associated instances first
    db.prepare('DELETE FROM instances WHERE client_id = ?').run(req.params.id);

    // Delete the client
    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);

    logAuditAction(req, 'DELETE', 'client', req.params.id, `Deleted client: ${client.name}`);

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete client' });
  }
});

export default router;
