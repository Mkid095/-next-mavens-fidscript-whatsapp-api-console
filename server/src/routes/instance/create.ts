import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';
import type { Client } from '../../types.js';
import { callEvolutionAPI, generateInstanceToken } from '../../utils/evolution.js';
import { logAuditAction } from '../../utils/audit.js';

const router = Router();

// POST /api/instance/create - Create a new instance (admin only)
router.post('/create', adminAuth, async (req: Request, res: Response) => {
  try {
    const { name, display_name, client_id } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Instance name is required' });
    }

    const existing = db.prepare('SELECT id FROM instances WHERE name = ?').get(name);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An instance with this name already exists' });
    }

    if (client_id) {
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id) as Client | undefined;
      if (!client) {
        return res.status(400).json({ success: false, error: 'Client not found' });
      }
      const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(client.plan_id) as { max_instances: number } | undefined;
      if (plan) {
        const currentInstances = db.prepare('SELECT COUNT(*) as count FROM instances WHERE client_id = ?').get(client_id) as { count: number };
        if (currentInstances.count >= plan.max_instances) {
          return res.status(400).json({ success: false, error: `Client has reached maximum instances limit (${plan.max_instances})` });
        }
      }
    }

    // Create instance in Evolution API if client_id is provided
    let evolutionInstanceName: string | null = null;
    if (client_id) {
      evolutionInstanceName = `${client_id}_${name}`;
      const evolutionResponse = await callEvolutionAPI('POST', '/instance/create', {
        instanceName: evolutionInstanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      });
      if (!evolutionResponse || !evolutionResponse.instance) {
        const errorMsg = typeof evolutionResponse?.response === 'object' && evolutionResponse?.response !== null && 'message' in evolutionResponse.response
          ? (evolutionResponse.response as { message?: string }).message?.[0]
          : evolutionResponse?.error || 'Failed to create instance in Evolution API';
        return res.status(400).json({ success: false, error: errorMsg });
      }

      // Set webhook on the Evolution API instance
      const webhookUrl = `${process.env.API_URL || 'https://apiwhatsapp.fidscript.com'}/api/webhook/evolution`;
      callEvolutionAPI('POST', `/webhook/set/${evolutionInstanceName}`, {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        headers: {},
        events: ['CONNECTION_UPDATE', 'QRCODE_UPDATED', 'MESSAGES_UPSERT'],
      }).catch(err => console.warn('Failed to set webhook on instance:', err));
    }

    const id = `inst_${uuidv4().substring(0, 8)}`;
    const instanceToken = generateInstanceToken();

    db.prepare(`
      INSERT INTO instances (id, name, display_name, client_id, instance_token, status, evolution_name, webhook_url, webhook_enabled)
      VALUES (?, ?, ?, ?, ?, 'disconnected', ?, ?, ?)
    `).run(id, name, display_name || name, client_id || null, instanceToken, evolutionInstanceName, client_id ? `${process.env.API_URL || 'https://apiwhatsapp.fidscript.com'}/api/webhook/evolution` : null, client_id ? 1 : 0);

    const instance = db.prepare('SELECT * FROM instances WHERE id = ?').get(id);
    logAuditAction(req, 'CREATE', 'instance', id, `Created instance: ${name}`);

    res.status(201).json({ success: true, data: instance, message: 'Instance created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create instance' });
  }
});

export default router;
