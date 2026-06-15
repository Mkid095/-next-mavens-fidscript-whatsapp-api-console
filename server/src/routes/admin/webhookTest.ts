import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';

const router = Router();
router.use(adminAuth);

// POST /api/admin/webhook/test — send a test payload to an instance's webhook_url
router.post('/webhook/test', async (req: Request, res: Response) => {
  try {
    const { instance_id, payload } = req.body as {
      instance_id?: string;
      payload?: Record<string, unknown>;
    };

    if (!instance_id) {
      res.status(400).json({ success: false, error: 'instance_id is required' });
      return;
    }

    const instance = db.prepare(`
      SELECT i.*, c.name as client_name
      FROM instances i
      JOIN clients c ON i.client_id = c.id
      WHERE i.id = ?
    `).get(instance_id) as { id: string; name: string; webhook_url?: string; client_name: string } | undefined;

    if (!instance) {
      res.status(404).json({ success: false, error: 'Instance not found' });
      return;
    }

    if (!instance.webhook_url) {
      res.status(422).json({ success: false, error: 'Instance has no webhook_url configured' });
      return;
    }

    // Default test payload simulating an inbound text message
    const testPayload = payload || {
      event: 'messages.upsert',
      session: instance.name,
      payload: {
        key: {
          remoteJid: '254700000000@s.whatsapp.net',
          fromMe: false,
          id: `test_${uuidv4().substring(0, 8)}`,
        },
        pushName: 'Test User',
        message: {
          conversation: 'This is a test message from the FIDScript webhook inspector.',
        },
        messageType: 'conversation',
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    };

    let webhookOk = false;
    let webhookStatus = 0;
    let responseBody = '';

    try {
      const response = await fetch(instance.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });
      webhookStatus = response.status;
      responseBody = await response.text();
      webhookOk = response.ok;
    } catch (fetchErr) {
      responseBody = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    }

    // Store the test event in inbox_messages for record
    const msgId = `test_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO inbox_messages (id, instance_id, client_id, from_number, from_name, message_type, content, is_read, direction, raw_payload)
      VALUES (?, ?, (SELECT client_id FROM instances WHERE id = ?), '254700000000', 'Webhook Inspector', 'text', ?, 1, 'incoming', ?)
    `).run(
      msgId,
      instance.id,
      instance.id,
      'Webhook test message',
      JSON.stringify(testPayload),
    );

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'webhook_test', 'instance', ?, ?)
    `).run(
      `wt_${Date.now()}`,
      (req as { user?: { id: string } }).user?.id || 'admin',
      instance.id,
      JSON.stringify({ webhook_url: instance.webhook_url, ok: webhookOk, status: webhookStatus }),
    );

    res.json({
      success: true,
      data: {
        instance: instance.name,
        webhook_url: instance.webhook_url,
        webhook_ok: webhookOk,
        webhook_status: webhookStatus,
        response_body: responseBody.substring(0, 500),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Webhook test failed' });
  }
});

// GET /api/admin/webhook/instances — list instances with webhook_url configured
router.get('/webhook/instances', (_req: Request, res: Response) => {
  try {
    const instances = db.prepare(`
      SELECT i.id, i.name, i.webhook_url, i.webhook_enabled, i.status, c.name as client_name
      FROM instances i
      JOIN clients c ON i.client_id = c.id
      WHERE i.webhook_url IS NOT NULL AND i.webhook_url != ''
      ORDER BY i.created_at DESC
    `).all();
    res.json({ success: true, data: instances });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch instances' });
  }
});

export default router;