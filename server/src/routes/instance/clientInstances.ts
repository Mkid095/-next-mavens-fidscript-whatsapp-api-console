import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { callGateway, generateInstanceToken, emitInstanceStateChange } from '../../utils/gateway.js';

const router = Router();

// POST /api/instance/client-create - Create a new instance for the authenticated client
router.post('/client-create', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const clientId = req.client?.id;
    if (!clientId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, display_name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Instance name is required' });
    }

    const existing = db.prepare('SELECT id FROM instances WHERE name = ? AND client_id = ?').get(name, clientId);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An instance with this name already exists' });
    }

    // Create instance in the gateway API (prefix with clientId for global uniqueness)
    const evolutionInstanceName = `${clientId}_${name}`;
    const evolutionResponse = await callGateway('POST', '/instance/create', {
      instanceName: evolutionInstanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    });

    if (!evolutionResponse || !evolutionResponse.instance) {
      const errorMsg = (typeof evolutionResponse?.response === 'object' && evolutionResponse?.response !== null && 'message' in evolutionResponse.response)
        ? (evolutionResponse.response as { message?: string }).message?.[0]
        : evolutionResponse?.error || 'Failed to create instance in the gateway API';
      return res.status(400).json({ success: false, error: errorMsg });
    }

    const id = `inst_${uuidv4().substring(0, 8)}`;
    const instanceToken = generateInstanceToken();
    const webhookUrl = `${process.env.API_URL || 'https://apiwhatsapp.fidscript.com'}/api/webhook/evolution`;

    // Set webhook on the the gateway API instance so CONNECTION_UPDATE and MESSAGES_UPSERT fire to our backend
    callGateway('POST', `/webhook/set/${evolutionInstanceName}`, {
      enabled: true,
      url: webhookUrl,
      webhookByEvents: false,
      webhookBase64: false,
      headers: {},
      events: ['CONNECTION_UPDATE', 'QRCODE_UPDATED', 'MESSAGES_UPSERT'],
    }).catch(err => console.warn('Failed to set webhook on instance:', err));

    db.prepare(`
      INSERT INTO instances (id, name, display_name, client_id, instance_token, status, evolution_name, webhook_url, webhook_enabled)
      VALUES (?, ?, ?, ?, ?, 'disconnected', ?, ?, 1)
    `).run(id, name, display_name || name, clientId, instanceToken, evolutionInstanceName, webhookUrl);

    const instance = db.prepare('SELECT * FROM instances WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: instance, message: 'Instance created successfully' });
  } catch (error) {
    console.error('Error creating client instance:', error);
    res.status(500).json({ success: false, error: 'Failed to create instance' });
  }
});

// GET /api/instance/client-instances - Get all instances for the authenticated client
router.get('/client-instances', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const clientId = req.client?.id;
    if (!clientId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const instances = db.prepare(`SELECT * FROM instances WHERE client_id = ? ORDER BY created_at DESC`).all(clientId);
    res.json({ success: true, data: instances });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch instances' });
  }
});


// GET /api/instance/client-settings/:name - Get settings for client's own instance
router.get('/client-settings/:name', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const instance = db.prepare(
      'SELECT * FROM instances WHERE name = ? AND client_id = ?'
    ).get(req.params.name, req.client?.id) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }
    const settings = JSON.parse(instance.settings || '{}');
    const defaults = { reject_calls: false, groups_ignore: false, always_online: true, read_messages: true, sync_full_history: false };
    res.json({ success: true, data: { ...defaults, ...settings } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/instance/client-settings/:name - Update settings for client's own instance
router.post('/client-settings/:name', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const instance = db.prepare(
      'SELECT * FROM instances WHERE name = ? AND client_id = ?'
    ).get(req.params.name, req.client?.id) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }

    // Save to local DB
    const current = JSON.parse(instance.settings || '{}');
    const updated = { ...current, ...req.body };
    db.prepare('UPDATE instances SET settings = ? WHERE name = ?').run(JSON.stringify(updated), req.params.name);

    // Apply settings to Evolution API (best-effort — never block on gateway errors)
    // All fields are required by the API — default false for absent booleans
    const evoName = instance.evolution_name || `${instance.client_id}_${instance.name}`;
    const evoSettings = {
      rejectCall: Boolean(updated.reject_calls ?? false),
      groupsIgnore: Boolean(updated.groups_ignore ?? false),
      alwaysOnline: Boolean(updated.always_online ?? false),
      readMessages: Boolean(updated.read_messages ?? false),
      readStatus: Boolean(updated.read_status ?? false),
      syncFullHistory: Boolean(updated.sync_full_history ?? false),
      msgCall: String(updated.msg_call ?? ''),
    };
    callGateway('POST', `/instance/settings/set/${evoName}`, evoSettings)
      .catch(err => console.warn(`[client-settings] failed to apply settings to Evolution for ${instance.name}:`, err));

    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
