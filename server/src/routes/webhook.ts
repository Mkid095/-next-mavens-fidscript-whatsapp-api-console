import { Router, Request, Response } from 'express';
import db from '../database.js';
import { callEvolutionAPI, emitInstanceStateChange, emitNewMessage } from '../utils/evolution.js';
import { logAuditAction } from '../utils/audit.js';

const router = Router();

// Evolution API sends this header to authenticate webhook calls
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '94977bc1fcb107c79d0687caea800bdb74edd67b5022771fc85c22ee389ca7e8';

/**
 * Extract phone number from a WhatsApp JID like "254700000000@s.whatsapp.net"
 */
function extractPhoneFromJid(sender: string): string | null {
  if (!sender) return null;
  // JID format: "254700000000@s.whatsapp.net" or "254700000000.1@s.whatsapp.net"
  const match = sender.match(/^(\d+)@/);
  if (match) {
    const phone = match[1];
    // Format as +254700000000
    return phone.startsWith('0') ? `+${phone}` : `+${phone}`;
  }
  return null;
}

/**
 * POST /api/webhook/evolution
 * Receives CONNECTION_UPDATE and MESSAGES_UPSERT events from Evolution API.
 * Authenticated via X-API-Key header matching our Evolution API key.
 */
router.post('/evolution', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey !== EVOLUTION_API_KEY) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { event, instance: instanceName, data, sender } = req.body as {
    event: string;
    instance: string;
    data: Record<string, unknown>;
    sender?: string;
  };

  if (!instanceName) {
    res.status(400).json({ success: false, error: 'Missing instance name' });
    return;
  }

  // Find instance by name OR evolution_name (Evolution API sends evolution_name as instance identifier)
  const decodedName = decodeURIComponent(instanceName);
  const instance = db.prepare(
    'SELECT id, name, client_id, evolution_name FROM instances WHERE name = ? OR evolution_name = ?'
  ).get(decodedName, decodedName) as { id: number; name: string; client_id: string; evolution_name?: string } | undefined;
  if (!instance) {
    res.status(200).json({ success: true, handled: false, reason: 'instance_not_found' });
    return;
  }

  // Handle CONNECTION_UPDATE
  if (event === 'connection.update') {
    const state = data?.state as string | undefined;

    let status: 'connected' | 'connecting' | 'disconnected' = 'disconnected';
    if (state === 'open') {
      status = 'connected';
    } else if (state === 'connecting') {
      status = 'connecting';
    } else {
      status = 'disconnected';
    }

    // Phone number is not in the CONNECTION_UPDATE payload — fetch it from connectionState
    let phoneNumber: string | null = null;
    if (status === 'connected') {
      try {
        const evoName = instance.evolution_name || decodedName;
        const evoRes = await callEvolutionAPI('GET', `/instance/connectionState/${evoName}`);
        const inst = (evoRes.instance as { state?: string; phone?: string; phone_number?: string } | undefined) || evoRes;
        phoneNumber = (inst?.phone as string | undefined) || (inst?.phone_number as string | undefined) || null;
      } catch {
        // Phone number fetch failed — leave as null
      }
    }

    db.prepare('UPDATE instances SET status = ?, phone_number = ?, last_active = ? WHERE name = ?').run(status, phoneNumber, new Date().toISOString(), instance.name);
    logAuditAction(req, 'CONNECTION_STATE', 'instance', String(instance.id), `Webhook: ${instance.name} -> ${status}`);
    // Emit using instance.name (our DB name) to match SSE subscription
    emitInstanceStateChange(instance.name, status, phoneNumber);
    res.status(200).json({ success: true, handled: true });
    return;
  }

  // Handle MESSAGES_UPSERT — extract phone from sender JID and update instance
  if (event === 'messages.upsert') {
    const key = data?.key as { remoteJid?: string; fromMe?: boolean; id?: string } | undefined;
    if (key && !key.fromMe) {
      const senderJid = (sender as string | undefined) || key.remoteJid;
      const phone = senderJid ? extractPhoneFromJid(senderJid) : null;
      const msgId = (data?.key as { id?: string })?.id || `msg_${Date.now()}`;
      const pushName = data?.pushName as string | undefined;

      const msgObj = data?.message as Record<string, unknown> || {};
      const content = (msgObj.conversation as string)
        || (msgObj.extendedTextMessage as { text?: string })?.text
        || (msgObj.imageMessage as { caption?: string })?.caption
        || (msgObj.videoMessage as { caption?: string })?.caption
        || (msgObj.documentMessage as { title?: string })?.title
        || '';
      const msgType = (data?.messageType as string) || 'text';

      const mediaUrl = (msgObj.imageMessage as { url?: string; mimetype?: string })?.url
        || (msgObj.videoMessage as { url?: string; mimetype?: string })?.url
        || (msgObj.documentMessage as { url?: string; mimetype?: string })?.url
        || null;

      const timestamp = new Date().toISOString();
      try {
        db.prepare(`
          INSERT OR IGNORE INTO inbox_messages (id, instance_id, client_id, from_number, from_name, message_type, content, media_url, is_read, direction)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'incoming')
        `).run(msgId, instance.id, instance.client_id, phone || senderJid || '', pushName || '', msgType, content, mediaUrl);
        // Update last_active on both instance and client when a message is received
        db.prepare('UPDATE instances SET last_active = ? WHERE id = ?').run(timestamp, instance.id);
        db.prepare('UPDATE clients SET last_active = ? WHERE id = ?').run(timestamp, instance.client_id);
      } catch {
        // Duplicate message ID — ignore
      }

      if (phone) {
        const current = db.prepare('SELECT phone_number FROM instances WHERE name = ?').get(instance.name) as { phone_number: string | null } | undefined;
        if (!current?.phone_number) {
          db.prepare('UPDATE instances SET phone_number = ? WHERE name = ?').run(phone, instance.name);
          logAuditAction(req, 'MESSAGE_RECEIVED', 'instance', String(instance.id), `Phone captured from message: ${phone}`);
        }
      }

      // Broadcast new message to SSE for real-time inbox
      emitNewMessage(instance.name, { id: msgId, from_number: phone || senderJid || '', from_name: pushName || '', message_type: msgType, content, media_url: mediaUrl, timestamp });
      emitInstanceStateChange(instance.name, 'connected', phone || null);
    }
    res.status(200).json({ success: true, handled: true });
    return;
  }

  // Other events — acknowledge without handling
  res.status(200).json({ success: true, handled: false });
});

export default router;
