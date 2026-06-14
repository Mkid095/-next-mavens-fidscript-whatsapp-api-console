import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { clientAuth, clientRateLimit } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { logApiRequest } from '../../utils/audit.js';

const router = Router();

// POST /api/instance/sendText/:name - Send text message
router.post('/sendText/:name', clientAuth, clientRateLimit, (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'Recipient (to) and message are required' });
    }

    const instance = db.prepare(`
      SELECT i.*, c.id as client_id, c.msg_count_today, c.total_messages
      FROM instances i JOIN clients c ON i.client_id = c.id
      WHERE i.name = ? AND i.client_id = ?
    `).get(req.params.name, req.client?.id) as (Instance & { client_id: string }) | undefined;

    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found or not owned by you' });
    }
    if (instance.status !== 'connected') {
      return res.status(400).json({ success: false, error: 'Instance is not connected' });
    }

    const messageId = `msg_${uuidv4().substring(0, 12)}`;
    db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(req.params.name);
    db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(req.client?.id ?? null);
    logApiRequest(req, instance.id, req.client?.id ?? null, 200, JSON.stringify({ messageId, to, message }));

    res.json({ success: true, data: { messageId, to, message, timestamp: new Date().toISOString() } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// POST /api/instance/sendMedia/:name - Send media message
router.post('/sendMedia/:name', clientAuth, clientRateLimit, (req: Request, res: Response) => {
  try {
    const { to, media_url, media_type, caption } = req.body;
    if (!to || !media_url) {
      return res.status(400).json({ success: false, error: 'Recipient (to) and media_url are required' });
    }

    const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, req.client?.id) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found or not owned by you' });
    }
    if (instance.status !== 'connected') {
      return res.status(400).json({ success: false, error: 'Instance is not connected' });
    }

    const messageId = `msg_${uuidv4().substring(0, 12)}`;
    db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(req.params.name);
    db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(req.client?.id ?? null);
    logApiRequest(req, instance.id, req.client?.id ?? null, 200, JSON.stringify({ messageId, to, media_url }));

    res.json({ success: true, data: { messageId, to, media_url, media_type: media_type || 'image', caption, timestamp: new Date().toISOString() } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send media' });
  }
});

// POST /api/instance/sendLocation/:name - Send location
router.post('/sendLocation/:name', clientAuth, clientRateLimit, (req: Request, res: Response) => {
  try {
    const { to, latitude, longitude, name, address } = req.body;
    if (!to || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Recipient (to), latitude, and longitude are required' });
    }

    const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, req.client?.id) as Instance | undefined;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found or not owned by you' });
    }
    if (instance.status !== 'connected') {
      return res.status(400).json({ success: false, error: 'Instance is not connected' });
    }

    const messageId = `msg_${uuidv4().substring(0, 12)}`;
    db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(req.params.name);
    db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(req.client?.id ?? null);

    res.json({ success: true, data: { messageId, to, location: { latitude, longitude, name, address }, timestamp: new Date().toISOString() } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send location' });
  }
});

export default router;
