import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';
import type { Instance, InstanceSettings } from '../../types.js';
import { logAuditAction } from '../../utils/audit.js';

const router = Router();

// GET /api/instance/credentials/:name - Get instance credentials
router.get('/credentials/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare(`
      SELECT i.*, c.name as client_name, c.api_key as client_api_key
      FROM instances i LEFT JOIN clients c ON i.client_id = c.id WHERE i.name = ?
    `).get(req.params.name);

    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }

    res.json({
      success: true,
      data: {
        instance_name: (instance as unknown as Instance).name,
        instance_token: (instance as unknown as Instance).instance_token,
        client_api_key: (instance as { client_api_key: string }).client_api_key,
        api_base_url: `${req.protocol}://${req.get('host')}/api/instance`,
        endpoints: {
          sendText: `POST /sendText/${(instance as unknown as Instance).name}`,
          sendMedia: `POST /sendMedia/${(instance as unknown as Instance).name}`,
          connectionState: `GET /connectionState/${(instance as unknown as Instance).name}`,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch credentials' });
  }
});

// GET /api/instance/settings/:name - Get instance settings
router.get('/settings/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }
    const settings = JSON.parse(instance.settings || '{}') as InstanceSettings;
    const defaultSettings: InstanceSettings = {
      reject_calls: false, groups_ignore: false, always_online: true,
      read_messages: true, sync_full_history: false,
    };
    res.json({ success: true, data: { ...defaultSettings, ...settings } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// POST /api/instance/settings/:name - Update instance settings
router.post('/settings/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }
    const settings = JSON.parse(instance.settings || '{}');
    const updatedSettings = { ...settings, ...req.body };
    db.prepare('UPDATE instances SET settings = ? WHERE name = ?').run(JSON.stringify(updatedSettings), req.params.name);
    logAuditAction(req, 'UPDATE', 'instance', instance.id, `Updated settings for ${req.params.name}`);
    res.json({ success: true, data: updatedSettings, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// GET /api/instance/webhook/:name - Get webhook config
router.get('/webhook/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }
    res.json({ success: true, data: { webhook_url: instance.webhook_url, webhook_enabled: instance.webhook_enabled === 1 } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch webhook config' });
  }
});

// POST /api/instance/webhook/:name - Set webhook config
router.post('/webhook/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }
    const { webhook_url, enabled } = req.body;
    db.prepare('UPDATE instances SET webhook_url = ?, webhook_enabled = ? WHERE name = ?').run(webhook_url || null, enabled ? 1 : 0, req.params.name);
    logAuditAction(req, 'UPDATE', 'instance', instance.id, `Updated webhook for ${req.params.name}`);
    res.json({ success: true, data: { webhook_url, webhook_enabled: enabled }, message: 'Webhook configuration updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update webhook' });
  }
});

export default router;
