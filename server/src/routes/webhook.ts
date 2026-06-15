import { Router, Request, Response } from 'express';
import db from '../database.js';
import { callEvolutionAPI, emitInstanceStateChange, emitNewMessage } from '../utils/evolution.js';
import { parseIncomingMessage } from '../utils/messageParser.js';
import { logAuditAction } from '../utils/audit.js';
import { emitDashboardRefresh } from '../utils/dashboardEmitter.js';
import { normalizePhone } from '../utils/phone.js';

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
 * Receives webhook events from Evolution API (connection.update, messages.upsert, qrcode.updated).
 * No auth needed — this endpoint is only reachable from the Evolution API server
 * (not public internet), since the URL is private and not exposed.
 */
router.post('/evolution', async (req: Request, res: Response) => {
  const rawBody = req.body as { event?: string; instance?: string; data?: Record<string, unknown>; sender?: string };
  const { event, instance: instanceName } = rawBody;

  const decodedName = instanceName ? decodeURIComponent(instanceName) : '';
  const instance = decodedName
    ? (db.prepare(
        'SELECT id, name, client_id, evolution_name FROM instances WHERE name = ? OR evolution_name = ?'
      ).get(decodedName, decodedName) as { id: number; name: string; client_id: string; evolution_name?: string } | undefined)
    : undefined;

  console.log('[WEBHOOK] event:', event, 'instance:', decodedName, 'instance found:', !!instance);

  const { data, sender } = rawBody;

  console.log('[WEBHOOK] event:', event, 'instanceName:', decodedName, 'sender:', sender);
  console.log('[WEBHOOK] Instance:', instance ? 'FOUND id=' + instance.id : 'NOT FOUND');

  if (!instance) {
    res.status(200).json({ success: true, handled: false, reason: 'instance_not_found' });
    return;
  }

  // Handle CONNECTION_UPDATE
  if (event === 'connection.update') {
    const state = data?.state as string | undefined;
    const wuid = data?.wuid as string | undefined;

    let status: 'connected' | 'connecting' | 'disconnected' = 'disconnected';
    if (state === 'open') {
      status = 'connected';
    } else if (state === 'connecting') {
      status = 'connecting';
    } else {
      status = 'disconnected';
    }

    // Extract phone number directly from wuid in the payload (e.g. "254732203353@s.whatsapp.net")
    let phoneNumber: string | null = null;
    if (wuid) {
      phoneNumber = extractPhoneFromJid(wuid);
    }

    // Fallback: fetch from Evolution API if not in payload
    if (!phoneNumber && status === 'connected') {
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
      const remoteJid = key.remoteJid || '';
      const isGroup = remoteJid.includes('@g.us');
      // Canonical sender phone. Group thread = group JID; individual thread = the
      // normalized sender phone, so incoming + outgoing for the same person join.
      const rawPhone = senderJid ? extractPhoneFromJid(senderJid) : null;
      const phone = rawPhone ? normalizePhone(rawPhone) : null;
      const chatId: string = isGroup ? (remoteJid || '') : (phone || remoteJid);
      const msgId = (data?.key as { id?: string })?.id || `msg_${Date.now()}`;
      const pushName = data?.pushName as string | undefined;

      const parsed = parseIncomingMessage(data ?? {});
      const timestamp = new Date().toISOString();
      try {
        db.prepare(`
          INSERT OR IGNORE INTO inbox_messages (id, instance_id, client_id, from_number, from_name, message_type, content, media_url, is_read, direction, extra, raw_payload, chat_id, is_group)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'incoming', ?, ?, ?, ?)
        `).run(
          msgId, instance.id, instance.client_id, phone || senderJid || '', pushName || '',
          parsed.messageType, parsed.content, parsed.mediaUrl,
          JSON.stringify(parsed.extra), JSON.stringify(rawBody),
          chatId, isGroup ? 1 : 0,
        );
        // Update last_active on both instance and client when a message is received
        db.prepare('UPDATE instances SET last_active = ? WHERE id = ?').run(timestamp, instance.id);
        db.prepare('UPDATE clients SET last_active = ? WHERE id = ?').run(timestamp, instance.client_id);
      } catch {
        // Duplicate message ID — ignore
      }

      if (phone && !isGroup) {
        // Auto-provision: any new number that texts in becomes a contact (deduped
        // by canonical phone) so it resolves to a name instead of a raw number.
        const existing = db.prepare('SELECT id, name FROM contacts WHERE client_id = ? AND phone = ?').get(instance.client_id, phone) as { id: string; name: string | null } | undefined;
        if (!existing) {
          db.prepare('INSERT INTO contacts (id, client_id, phone, name, tags) VALUES (?, ?, ?, ?, ?)')
            .run(`auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, instance.client_id, phone, pushName || '', 'auto');
        } else if (pushName && !existing.name) {
          db.prepare('UPDATE contacts SET name = ? WHERE id = ?').run(pushName, existing.id);
        }

        const current = db.prepare('SELECT phone_number FROM instances WHERE name = ?').get(instance.name) as { phone_number: string | null } | undefined;
        if (!current?.phone_number) {
          db.prepare('UPDATE instances SET phone_number = ? WHERE name = ?').run(phone, instance.name);
          logAuditAction(req, 'MESSAGE_RECEIVED', 'instance', String(instance.id), `Phone captured from message: ${phone}`);
        }
      }

      // Broadcast new message to SSE for real-time inbox — include chat_id and is_group
      emitNewMessage(instance.name, { id: msgId, from_number: phone || senderJid || '', from_name: pushName || '', message_type: parsed.messageType, content: parsed.content, media_url: parsed.mediaUrl, timestamp, chat_id: chatId, is_group: isGroup ? 1 : 0 });
      emitInstanceStateChange(instance.name, 'connected', phone || null);
      emitDashboardRefresh(instance.client_id);
    }
    res.status(200).json({ success: true, handled: true });
    return;
  }

  // Other events — acknowledge without handling
  res.status(200).json({ success: true, handled: false });
});

export default router;
