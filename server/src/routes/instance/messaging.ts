import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { clientAuth, clientRateLimit } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { callEvolutionAPI } from '../../utils/evolution.js';
import { logApiRequest } from '../../utils/audit.js';

const router = Router();

const TOKEN_COST_TEXT = 1;
const TOKEN_COST_MEDIA = 2;

function deductTokens(clientId: string, amount: number, reference: string): boolean {
  const client = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(clientId) as { token_balance: number } | undefined;
  if (!client || client.token_balance < amount) return false;
  db.prepare('UPDATE clients SET token_balance = token_balance - ? WHERE id = ?').run(amount, clientId);
  db.prepare('INSERT INTO token_transactions (id, client_id, type, amount, reference) VALUES (?, ?, ?, ?, ?)')
    .run(`txn_${uuidv4().substring(0, 8)}`, clientId, 'sent', -amount, reference);
  return true;
}

function saveSentMessage(instanceId: string, clientId: string, msgId: string, to: string, content: string, messageType = 'text', mediaUrl?: string) {
  db.prepare(`
    INSERT INTO inbox_messages (id, instance_id, client_id, from_number, from_name, message_type, content, media_url, is_read, direction)
    VALUES (?, ?, ?, ?, '', ?, ?, ?, 1, 'outgoing')
  `).run(msgId, instanceId, clientId, to, messageType, content, mediaUrl || null);
}

// POST /api/instance/sendText/:name - Send text message
router.post('/sendText/:name', clientAuth, clientRateLimit, async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'Recipient (to) and message are required' });
    }

    const instance = db.prepare(`
      SELECT i.*, c.id as client_id, c.token_balance
      FROM instances i JOIN clients c ON i.client_id = c.id
      WHERE i.name = ? AND i.client_id = ?
    `).get(req.params.name, req.client?.id) as (Instance & { client_id: string }) | undefined;

    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found or not owned by you' });
    }
    if (instance.status !== 'connected') {
      return res.status(400).json({ success: false, error: 'Instance is not connected' });
    }

    if (!deductTokens(instance.client_id, TOKEN_COST_TEXT, `send_text_${instance.name}`)) {
      return res.status(402).json({ success: false, error: 'Insufficient token balance' });
    }

    const msgId = `msg_${uuidv4().substring(0, 12)}`;
    const evolutionName = instance.evolution_name || `${instance.client_id}_${instance.name}`;

    // Call Evolution API to send the message
    const evoRes = await callEvolutionAPI('POST', `/messages/sendText/${evolutionName}`, {
      number: to,
      text: message,
    });

    db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(req.params.name);
    db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(instance.client_id);
    saveSentMessage(instance.id, instance.client_id, msgId, to, message);
    logApiRequest(req, instance.id, instance.client_id, 200, JSON.stringify({ msgId, to, message }));

    res.json({ success: true, data: { messageId: msgId, to, message, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('sendText error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// POST /api/instance/sendMedia/:name - Send media message
router.post('/sendMedia/:name', clientAuth, clientRateLimit, async (req: Request, res: Response) => {
  try {
    const { to, media_url, media_type, caption } = req.body;
    if (!to || !media_url) {
      return res.status(400).json({ success: false, error: 'Recipient (to) and media_url are required' });
    }

    const instance = db.prepare(`
      SELECT i.*, c.id as client_id
      FROM instances i JOIN clients c ON i.client_id = c.id
      WHERE i.name = ? AND i.client_id = ?
    `).get(req.params.name, req.client?.id) as (Instance & { client_id: string }) | undefined;

    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found or not owned by you' });
    }
    if (instance.status !== 'connected') {
      return res.status(400).json({ success: false, error: 'Instance is not connected' });
    }

    if (!deductTokens(instance.client_id, TOKEN_COST_MEDIA, `send_media_${instance.name}`)) {
      return res.status(402).json({ success: false, error: 'Insufficient token balance' });
    }

    const msgId = `msg_${uuidv4().substring(0, 12)}`;
    const evolutionName = instance.evolution_name || `${instance.client_id}_${instance.name}`;
    const msgType = media_type || 'image';

    await callEvolutionAPI('POST', `/messages/sendMedia/${evolutionName}`, {
      number: to,
      mediatype: msgType,
      media: media_url,
      caption: caption || '',
    });

    db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(req.params.name);
    db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(instance.client_id);
    saveSentMessage(instance.id, instance.client_id, msgId, to, caption || '', msgType, media_url);
    logApiRequest(req, instance.id, instance.client_id, 200, JSON.stringify({ msgId, to, media_url, media_type: msgType }));

    res.json({ success: true, data: { messageId: msgId, to, media_url, media_type: msgType, caption, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('sendMedia error:', error);
    res.status(500).json({ success: false, error: 'Failed to send media' });
  }
});

// POST /api/instance/sendLocation/:name - Send location
router.post('/sendLocation/:name', clientAuth, clientRateLimit, async (req: Request, res: Response) => {
  try {
    const { to, latitude, longitude, name, address } = req.body;
    if (!to || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Recipient (to), latitude, and longitude are required' });
    }

    const instance = db.prepare(`
      SELECT i.*, c.id as client_id
      FROM instances i JOIN clients c ON i.client_id = c.id
      WHERE i.name = ? AND i.client_id = ?
    `).get(req.params.name, req.client?.id) as (Instance & { client_id: string }) | undefined;

    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found or not owned by you' });
    }
    if (instance.status !== 'connected') {
      return res.status(400).json({ success: false, error: 'Instance is not connected' });
    }

    if (!deductTokens(instance.client_id, TOKEN_COST_TEXT, `send_location_${instance.name}`)) {
      return res.status(402).json({ success: false, error: 'Insufficient token balance' });
    }

    const msgId = `msg_${uuidv4().substring(0, 12)}`;
    const evolutionName = instance.evolution_name || `${instance.client_id}_${instance.name}`;

    await callEvolutionAPI('POST', `/messages/sendLocation/${evolutionName}`, {
      number: to,
      latitude,
      longitude,
      name: name || '',
      address: address || '',
    });

    db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(req.params.name);
    db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(instance.client_id);

    const locationContent = `${name || ''} ${address || ''} (${latitude},${longitude})`;
    saveSentMessage(instance.id, instance.client_id, msgId, to, locationContent, 'location');

    res.json({ success: true, data: { messageId: msgId, to, location: { latitude, longitude, name, address }, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('sendLocation error:', error);
    res.status(500).json({ success: false, error: 'Failed to send location' });
  }
});

export default router;
