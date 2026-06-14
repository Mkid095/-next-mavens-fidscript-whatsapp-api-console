import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { callEvolutionAPI, generateInstanceToken } from '../../utils/evolution.js';

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

    // Create instance in Evolution API (prefix with clientId for global uniqueness)
    const evolutionInstanceName = `${clientId}_${name}`;
    const evolutionResponse = await callEvolutionAPI('POST', '/instance/create', {
      instanceName: evolutionInstanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    });

    if (!evolutionResponse || !evolutionResponse.instance) {
      const errorMsg = (typeof evolutionResponse?.response === 'object' && evolutionResponse?.response !== null && 'message' in evolutionResponse.response)
        ? (evolutionResponse.response as { message?: string }).message?.[0]
        : evolutionResponse?.error || 'Failed to create instance in Evolution API';
      return res.status(400).json({ success: false, error: errorMsg });
    }

    const id = `inst_${uuidv4().substring(0, 8)}`;
    const instanceToken = generateInstanceToken();

    db.prepare(`
      INSERT INTO instances (id, name, display_name, client_id, instance_token, status, evolution_name)
      VALUES (?, ?, ?, ?, ?, 'disconnected', ?)
    `).run(id, name, display_name || name, clientId, instanceToken, evolutionInstanceName);

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

export default router;
