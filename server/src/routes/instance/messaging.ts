import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { clientJwtAuth, clientRateLimit } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { callEvolutionAPI, emitTokenUpdate } from '../../utils/evolution.js';
import { logApiRequest } from '../../utils/audit.js';
import { emitDashboardRefresh } from '../../utils/dashboardEmitter.js';
import {
  TOKEN_COST_TEXT,
  TOKEN_COST_MEDIA,
  TOKEN_COST_LOCATION,
  TOKEN_COST_CONTACT,
  TOKEN_COST_REACTION,
  TOKEN_COST_POLL,
  TOKEN_COST_LIST,
} from '../../utils/tokenCosts.js';

const router = Router();

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

function updateCounters(instanceName: string, clientId: string) {
  db.prepare('UPDATE instances SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1, last_active = CURRENT_TIMESTAMP WHERE name = ?').run(instanceName);
  db.prepare('UPDATE clients SET msg_count_today = msg_count_today + 1, total_messages = total_messages + 1 WHERE id = ?').run(clientId);
}

// POST /api/instance/sendText/:name - Send text message
router.post('/sendText/:name', clientJwtAuth, clientRateLimit, async (req: Request, res: Response) => {
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
    const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(instance.client_id) as { token_balance: number };
    emitTokenUpdate(instance.name, updated?.token_balance ?? 0);

    const msgId = `msg_${uuidv4().substring(0, 12)}`;
    const evolutionName = instance.evolution_name || `${instance.client_id}_${instance.name}`;

    await callEvolutionAPI('POST', `/message/sendText/${evolutionName}`, {
      number: to,
      text: message,
    });

    updateCounters(instance.name, instance.client_id);
    saveSentMessage(instance.id, instance.client_id, msgId, to, message);
    logApiRequest(req, instance.id, instance.client_id, 200, JSON.stringify({ msgId, to, message }));
    emitDashboardRefresh(instance.client_id);

    res.json({ success: true, data: { messageId: msgId, to, message, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('sendText error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// POST /api/instance/sendMedia/:name - Send media message
router.post('/sendMedia/:name', clientJwtAuth, clientRateLimit, async (req: Request, res: Response) => {
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
    const updatedMedia = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(instance.client_id) as { token_balance: number };
    emitTokenUpdate(instance.name, updatedMedia?.token_balance ?? 0);

    const msgId = `msg_${uuidv4().substring(0, 12)}`;
    const evolutionName = instance.evolution_name || `${instance.client_id}_${instance.name}`;
    const msgType = media_type || 'image';

    await callEvolutionAPI('POST', `/message/sendMedia/${evolutionName}`, {
      number: to,
      mediatype: msgType,
      media: media_url,
      caption: caption || '',
    });

    updateCounters(instance.name, instance.client_id);
    saveSentMessage(instance.id, instance.client_id, msgId, to, caption || '', msgType, media_url);
    logApiRequest(req, instance.id, instance.client_id, 200, JSON.stringify({ msgId, to, media_url, media_type: msgType }));
    emitDashboardRefresh(instance.client_id);

    res.json({ success: true, data: { messageId: msgId, to, media_url, media_type: msgType, caption, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('sendMedia error:', error);
    res.status(500).json({ success: false, error: 'Failed to send media' });
  }
});

// POST /api/instance/sendLocation/:name - Send location
router.post('/sendLocation/:name', clientJwtAuth, clientRateLimit, async (req: Request, res: Response) => {
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

    if (!deductTokens(instance.client_id, TOKEN_COST_LOCATION, `send_location_${instance.name}`)) {
      return res.status(402).json({ success: false, error: 'Insufficient token balance' });
    }
    const updatedLoc = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(instance.client_id) as { token_balance: number };
    emitTokenUpdate(instance.name, updatedLoc?.token_balance ?? 0);

    const msgId = `msg_${uuidv4().substring(0, 12)}`;
    const evolutionName = instance.evolution_name || `${instance.client_id}_${instance.name}`;

    await callEvolutionAPI('POST', `/message/sendLocation/${evolutionName}`, {
      number: to,
      latitude,
      longitude,
      name: name || '',
      address: address || '',
    });

    updateCounters(instance.name, instance.client_id);
    const locationContent = `${name || ''} ${address || ''} (${latitude},${longitude})`;
    saveSentMessage(instance.id, instance.client_id, msgId, to, locationContent, 'location');
    logApiRequest(req, instance.id, instance.client_id, 200, JSON.stringify({ msgId, to, latitude, longitude }));
    emitDashboardRefresh(instance.client_id);

    res.json({ success: true, data: { messageId: msgId, to, location: { latitude, longitude, name, address }, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('sendLocation error:', error);
    res.status(500).json({ success: false, error: 'Failed to send location' });
  }
});

// POST /api/instance/sendContact/:name - Send contact card
router.post('/sendContact/:name', clientJwtAuth, clientRateLimit, async (req: Request, res: Response) => {
  try {
    const { to, contact } = req.body;
    if (!to || !contact || !Array.isArray(contact) || contact.length === 0) {
      return res.status(400).json({ success: false, error: 'Recipient (to) and contact array are required' });
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

    if (!deductTokens(instance.client_id, TOKEN_COST_CONTACT, `send_contact_${instance.name}`)) {
      return res.status(402).json({ success: false, error: 'Insufficient token balance' });
    }
    const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(instance.client_id) as { token_balance: number };
    emitTokenUpdate(instance.name, updated?.token_balance ?? 0);

    const msgId = `msg_${uuidv4().substring(0, 12)}`;
    const evolutionName = instance.evolution_name || `${instance.client_id}_${instance.name}`;

    await callEvolutionAPI('POST', `/message/sendContact/${evolutionName}`, {
      number: to,
      contact,
    });

    updateCounters(instance.name, instance.client_id);
    const contactName = contact[0]?.fullName || 'Contact';
    saveSentMessage(instance.id, instance.client_id, msgId, to, contactName, 'contact');
    logApiRequest(req, instance.id, instance.client_id, 200, JSON.stringify({ msgId, to, contact }));
    emitDashboardRefresh(instance.client_id);

    res.json({ success: true, data: { messageId: msgId, to, contact: contact[0], timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('sendContact error:', error);
    res.status(500).json({ success: false, error: 'Failed to send contact' });
  }
});

// POST /api/instance/sendReaction/:name - Send reaction to a message
router.post('/sendReaction/:name', clientJwtAuth, clientRateLimit, async (req: Request, res: Response) => {
  try {
    const { to, key, reaction } = req.body;
    if (!to || !key || !reaction) {
      return res.status(400).json({ success: false, error: 'Recipient (to), message key, and reaction are required' });
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

    if (!deductTokens(instance.client_id, TOKEN_COST_REACTION, `send_reaction_${instance.name}`)) {
      return res.status(402).json({ success: false, error: 'Insufficient token balance' });
    }
    const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(instance.client_id) as { token_balance: number };
    emitTokenUpdate(instance.name, updated?.token_balance ?? 0);

    const msgId = `msg_${uuidv4().substring(0, 12)}`;
    const evolutionName = instance.evolution_name || `${instance.client_id}_${instance.name}`;

    await callEvolutionAPI('POST', `/message/sendReaction/${evolutionName}`, {
      key,
      reaction,
    });

    updateCounters(instance.name, instance.client_id);
    saveSentMessage(instance.id, instance.client_id, msgId, to, reaction, 'reaction');
    logApiRequest(req, instance.id, instance.client_id, 200, JSON.stringify({ msgId, to, key, reaction }));
    emitDashboardRefresh(instance.client_id);

    res.json({ success: true, data: { messageId: msgId, to, reaction, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('sendReaction error:', error);
    res.status(500).json({ success: false, error: 'Failed to send reaction' });
  }
});

// POST /api/instance/sendPoll/:name - Send poll message
router.post('/sendPoll/:name', clientJwtAuth, clientRateLimit, async (req: Request, res: Response) => {
  try {
    const { to, name, selectableCount, values } = req.body;
    if (!to || !name || !selectableCount || !values || !Array.isArray(values) || values.length < 2) {
      return res.status(400).json({ success: false, error: 'Recipient (to), poll name, selectableCount, and at least 2 values are required' });
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

    if (!deductTokens(instance.client_id, TOKEN_COST_POLL, `send_poll_${instance.name}`)) {
      return res.status(402).json({ success: false, error: 'Insufficient token balance' });
    }
    const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(instance.client_id) as { token_balance: number };
    emitTokenUpdate(instance.name, updated?.token_balance ?? 0);

    const msgId = `msg_${uuidv4().substring(0, 12)}`;
    const evolutionName = instance.evolution_name || `${instance.client_id}_${instance.name}`;

    await callEvolutionAPI('POST', `/message/sendPoll/${evolutionName}`, {
      number: to,
      name,
      selectableCount,
      values,
    });

    updateCounters(instance.name, instance.client_id);
    saveSentMessage(instance.id, instance.client_id, msgId, to, name, 'poll');
    logApiRequest(req, instance.id, instance.client_id, 200, JSON.stringify({ msgId, to, name, selectableCount, values }));
    emitDashboardRefresh(instance.client_id);

    res.json({ success: true, data: { messageId: msgId, to, poll: { name, selectableCount, values }, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('sendPoll error:', error);
    res.status(500).json({ success: false, error: 'Failed to send poll' });
  }
});

// POST /api/instance/sendList/:name - Send list message
router.post('/sendList/:name', clientJwtAuth, clientRateLimit, async (req: Request, res: Response) => {
  try {
    const { to, title, description, buttonText, footerText, sections } = req.body;
    if (!to || !title || !buttonText || !sections || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ success: false, error: 'Recipient (to), title, buttonText, and sections are required' });
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

    if (!deductTokens(instance.client_id, TOKEN_COST_LIST, `send_list_${instance.name}`)) {
      return res.status(402).json({ success: false, error: 'Insufficient token balance' });
    }
    const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(instance.client_id) as { token_balance: number };
    emitTokenUpdate(instance.name, updated?.token_balance ?? 0);

    const msgId = `msg_${uuidv4().substring(0, 12)}`;
    const evolutionName = instance.evolution_name || `${instance.client_id}_${instance.name}`;

    await callEvolutionAPI('POST', `/message/sendList/${evolutionName}`, {
      number: to,
      title,
      description: description || '',
      buttonText,
      footerText: footerText || '',
      sections,
    });

    updateCounters(instance.name, instance.client_id);
    saveSentMessage(instance.id, instance.client_id, msgId, to, title, 'list');
    logApiRequest(req, instance.id, instance.client_id, 200, JSON.stringify({ msgId, to, title, buttonText, sections }));
    emitDashboardRefresh(instance.client_id);

    res.json({ success: true, data: { messageId: msgId, to, list: { title, description, buttonText, footerText, sections }, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('sendList error:', error);
    res.status(500).json({ success: false, error: 'Failed to send list message' });
  }
});

export default router;
