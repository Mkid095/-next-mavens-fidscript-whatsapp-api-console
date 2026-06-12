import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../database.js';
import { adminAuth, clientAuth, clientRateLimit } from '../middleware/auth.js';
import type { Instance, Client, InstanceSettings } from '../types.js';

const router = Router();

// Generate instance token
function generateInstanceToken(): string {
  return `inst_${crypto.randomBytes(16).toString('hex')}`;
}

// Generate instance name
function generateInstanceName(): string {
  return `inst_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// Log admin action
function logAuditAction(req: Request, action: string, entityType: string, entityId: string, details?: string) {
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), req.user?.id || 'system', action, entityType, entityId, details || null, req.ip);
}

// Log API request
function logApiRequest(req: Request, instanceId: string | null, clientId: string | null, status: number, responseBody?: string) {
  db.prepare(`
    INSERT INTO api_logs (id, instance_id, client_id, method, endpoint, request_body, response_status, response_body, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    instanceId,
    clientId,
    req.method,
    req.path,
    JSON.stringify(req.body) || null,
    status,
    responseBody ? JSON.stringify(responseBody).substring(0, 1000) : null,
    req.ip,
    req.headers['user-agent']
  );
}

// ====================
// ADMIN ROUTES
// ====================

// POST /api/instance/create - Create a new instance (admin only)
router.post('/create', adminAuth, (req: Request, res: Response) => {
  try {
    const { name, display_name, client_id } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Instance name is required',
      });
    }

    // Check if name already exists
    const existing = db.prepare('SELECT id FROM instances WHERE name = ?').get(name);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'An instance with this name already exists',
      });
    }

    // If client_id provided, verify client exists and check instance limit
    if (client_id) {
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id) as Client | undefined;
      if (!client) {
        return res.status(400).json({
          success: false,
          error: 'Client not found',
        });
      }

      const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(client.plan_id) as { max_instances: number } | undefined;
      if (plan) {
        const currentInstances = db.prepare('SELECT COUNT(*) as count FROM instances WHERE client_id = ?').get(client_id) as { count: number };
        if (currentInstances.count >= plan.max_instances) {
          return res.status(400).json({
            success: false,
            error: `Client has reached maximum instances limit (${plan.max_instances})`,
          });
        }
      }
    }

    const id = `inst_${uuidv4().substring(0, 8)}`;
    const instanceToken = generateInstanceToken();

    db.prepare(`
      INSERT INTO instances (id, name, display_name, client_id, instance_token, status)
      VALUES (?, ?, ?, ?, ?, 'disconnected')
    `).run(id, name, display_name || name, client_id || null, instanceToken);

    const instance = db.prepare('SELECT * FROM instances WHERE id = ?').get(id);

    logAuditAction(req, 'CREATE', 'instance', id, `Created instance: ${name}`);

    res.status(201).json({
      success: true,
      data: instance,
      message: 'Instance created successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create instance' });
  }
});

// GET /api/instance/credentials/:name - Get instance credentials
router.get('/credentials/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare(`
      SELECT i.*, c.name as client_name, c.api_key as client_api_key
      FROM instances i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.name = ?
    `).get(req.params.name);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }

    res.json({
      success: true,
      data: {
        instance_name: (instance as Instance).name,
        instance_token: (instance as Instance).instance_token,
        client_api_key: (instance as { client_api_key: string }).client_api_key,
        api_base_url: `${req.protocol}://${req.get('host')}/api/instance`,
        endpoints: {
          sendText: `POST /sendText/${(instance as Instance).name}`,
          sendMedia: `POST /sendMedia/${(instance as Instance).name}`,
          connectionState: `GET /connectionState/${(instance as Instance).name}`,
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
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }

    const settings = JSON.parse(instance.settings || '{}') as InstanceSettings;
    const defaultSettings: InstanceSettings = {
      reject_calls: false,
      groups_ignore: false,
      always_online: true,
      read_messages: true,
      sync_full_history: false,
    };

    res.json({
      success: true,
      data: { ...defaultSettings, ...settings },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// POST /api/instance/settings/:name - Update instance settings
router.post('/settings/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }

    const settings = JSON.parse(instance.settings || '{}');
    const updatedSettings = { ...settings, ...req.body };

    db.prepare('UPDATE instances SET settings = ? WHERE name = ?').run(
      JSON.stringify(updatedSettings),
      req.params.name
    );

    logAuditAction(req, 'UPDATE', 'instance', instance.id, `Updated settings for ${req.params.name}`);

    res.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// GET /api/instance/webhook/:name - Get webhook config
router.get('/webhook/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }

    res.json({
      success: true,
      data: {
        webhook_url: instance.webhook_url,
        webhook_enabled: instance.webhook_enabled === 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch webhook config' });
  }
});

// POST /api/instance/webhook/:name - Set webhook config
router.post('/webhook/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }

    const { webhook_url, enabled } = req.body;

    db.prepare('UPDATE instances SET webhook_url = ?, webhook_enabled = ? WHERE name = ?').run(
      webhook_url || null,
      enabled ? 1 : 0,
      req.params.name
    );

    logAuditAction(req, 'UPDATE', 'instance', instance.id, `Updated webhook for ${req.params.name}`);

    res.json({
      success: true,
      data: { webhook_url, webhook_enabled: enabled },
      message: 'Webhook configuration updated',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update webhook' });
  }
});

// GET /api/instance/connect/:name - Generate QR code (simulated)
router.get('/connect/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }

    // Update status to connecting
    db.prepare("UPDATE instances SET status = 'connecting' WHERE name = ?").run(req.params.name);

    // In production, this would call Baileys to generate a real QR code
    // For now, simulate a QR code response
    const qrCode = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;

    db.prepare('UPDATE instances SET qr_code = ? WHERE name = ?').run(qrCode, req.params.name);

    logAuditAction(req, 'CONNECT', 'instance', instance.id, `QR code generated for ${req.params.name}`);

    res.json({
      success: true,
      data: {
        qrcode: qrCode,
        qrcode_image: qrCode,
        expires_in: 60, // seconds
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate QR code' });
  }
});

// GET /api/instance/connectionState/:name - Get connection state
router.get('/connectionState/:name', (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }

    res.json({
      success: true,
      data: {
        name: instance.name,
        status: instance.status,
        phone_number: instance.phone_number,
        qr_code: instance.qr_code,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch connection state' });
  }
});

// DELETE /api/instance/logout/:name - Disconnect instance
router.delete('/logout/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }

    db.prepare("UPDATE instances SET status = 'disconnected', qr_code = NULL, phone_number = NULL WHERE name = ?").run(req.params.name);

    logAuditAction(req, 'DISCONNECT', 'instance', instance.id, `Disconnected ${req.params.name}`);

    res.json({
      success: true,
      message: 'Instance disconnected successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to disconnect instance' });
  }
});

// DELETE /api/instance/delete/:name - Delete instance
router.delete('/delete/:name', adminAuth, (req: Request, res: Response) => {
  try {
    const instance = db.prepare('SELECT * FROM instances WHERE name = ?').get(req.params.name) as Instance | undefined;

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }

    db.prepare('DELETE FROM instances WHERE name = ?').run(req.params.name);

    logAuditAction(req, 'DELETE', 'instance', instance.id, `Deleted instance ${req.params.name}`);

    res.json({
      success: true,
      message: 'Instance deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete instance' });
  }
});

// ====================
// CLIENT API ROUTES (with rate limiting)
// ====================

// POST /api/instance/sendText/:name - Send text message
router.post('/sendText/:name', clientAuth, clientRateLimit, (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Recipient (to) and message are required',
      });
    }

    const instance = db.prepare(`
      SELECT i.*, c.id as client_id, c.msg_count_today, c.total_messages
      FROM instances i
      JOIN clients c ON i.client_id = c.id
      WHERE i.name = ? AND i.client_id = ?
    `).get(req.params.name, req.client?.id) as (Instance & { client_id: string; msg_count_today: number; total_messages: number }) | undefined;

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found or not owned by you',
      });
    }

    if (instance.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Instance is not connected',
      });
    }

    // In production, this would send via Baileys
    // For now, simulate successful send
    const messageId = `msg_${uuidv4().substring(0, 12)}`;

    // Update message counts
    db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(req.params.name);
    db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(req.client?.id);

    logApiRequest(req, instance.id, req.client?.id, 200, { messageId, to, message });

    res.json({
      success: true,
      data: {
        messageId,
        to,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// POST /api/instance/sendMedia/:name - Send media message
router.post('/sendMedia/:name', clientAuth, clientRateLimit, (req: Request, res: Response) => {
  try {
    const { to, media_url, media_type, caption } = req.body;

    if (!to || !media_url) {
      return res.status(400).json({
        success: false,
        error: 'Recipient (to) and media_url are required',
      });
    }

    const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, req.client?.id) as Instance | undefined;

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found or not owned by you',
      });
    }

    if (instance.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Instance is not connected',
      });
    }

    const messageId = `msg_${uuidv4().substring(0, 12)}`;

    db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(req.params.name);
    db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(req.client?.id);

    logApiRequest(req, instance.id, req.client?.id, 200, { messageId, to, media_url });

    res.json({
      success: true,
      data: {
        messageId,
        to,
        media_url,
        media_type: media_type || 'image',
        caption,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send media' });
  }
});

// POST /api/instance/sendLocation/:name - Send location
router.post('/sendLocation/:name', clientAuth, clientRateLimit, (req: Request, res: Response) => {
  try {
    const { to, latitude, longitude, name, address } = req.body;

    if (!to || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Recipient (to), latitude, and longitude are required',
      });
    }

    const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, req.client?.id) as Instance | undefined;

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found or not owned by you',
      });
    }

    if (instance.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'Instance is not connected',
      });
    }

    const messageId = `msg_${uuidv4().substring(0, 12)}`;

    db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(req.params.name);
    db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(req.client?.id);

    res.json({
      success: true,
      data: {
        messageId,
        to,
        location: { latitude, longitude, name, address },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send location' });
  }
});

export default router;
