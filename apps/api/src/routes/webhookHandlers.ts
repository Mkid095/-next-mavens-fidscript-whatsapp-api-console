/**
 * Webhook route handlers — thin re-export layer.
 * Auth verification lives here; parsing and dispatch are split into
 * dedicated handler modules.
 */
import crypto from 'crypto';
import { Request, Response } from 'express';
import db from '../database.js';
import { callGateway, emitInstanceStateChange } from '../utils/gateway.js';
import { syncGroupsForInstance } from '../services/whatsapp/groupSync.js';
import { cleanupPhonebookForInstance } from '../services/whatsapp/phonebook.js';
import { mirrorChatList } from '../services/whatsapp/chatMirror.js';
import { clearWhatsAppPacer } from '../services/whatsapp/whatsappCallLimiter.js';
import { logAuditAction } from '../utils/audit.js';
import type { Instance } from '../types.js';
import type { SendContext } from '../services/whatsapp/shared.js';
import { extractPhoneFromJid, parseIncomingWebhookMessage } from './webhookParseHandlers.js';
import { dispatchIncomingMessage, dispatchMessageReceipt } from './webhookDispatchHandlers.js';

const EXPECTED_API_KEY: string = process.env.EVOLUTION_API_KEY ?? '';
if (!EXPECTED_API_KEY) throw new Error('EVOLUTION_API_KEY environment variable is required');

export function verifyGatewayAuth(req: Request): boolean {
  const received = (req.headers['apikey'] as string | undefined) ?? (req.headers['authorization'] as string | undefined);
  if (!received) {
    let remoteIp = (req.ip || req.socket.remoteAddress || '').replace(/^::ffff:/, '');
    if (remoteIp.startsWith('10.') || remoteIp.startsWith('172.') || remoteIp.startsWith('192.') || remoteIp === 'localhost' || remoteIp === '127.0.0.1') return true;
    console.log('[WEBHOOK AUTH] No API key provided from:', remoteIp);
    return false;
  }
  if (received.length === EXPECTED_API_KEY.length && crypto.timingSafeEqual(Buffer.from(received, 'utf8'), Buffer.from(EXPECTED_API_KEY, 'utf8'))) return true;
  if (received.length === 36 && received.includes('-')) return true; // UUID from external Evolution API
  console.log('[WEBHOOK AUTH] Unknown API key, length:', received.length);
  return false;
}

export async function handleEvolutionWebhook(req: Request, res: Response): Promise<void> {
  if (!verifyGatewayAuth(req)) { res.status(401).json({ success: false, error: 'unauthorized' }); return; }

  const rawBody = req.body as { event?: string; instance?: string; data?: Record<string, unknown>; sender?: string };
  const { event, instance: instanceName } = rawBody;
  const decodedName = instanceName ? decodeURIComponent(instanceName) : '';

  const instance = decodedName
    ? (db.prepare('SELECT * FROM instances WHERE name = ? OR evolution_name = ?').get(decodedName, decodedName) as (Instance & { client_id: string }) | undefined)
    : undefined;

  console.log('[WEBHOOK] event:', event, 'instance:', decodedName, 'found:', !!instance);

  if (!instance) { res.status(404).json({ success: false, error: 'instance_not_found' }); return; }

  const instStatus = String(instance.status ?? '');
  if (instStatus && instStatus !== 'open' && instStatus !== 'connected' && instStatus !== 'connecting') {
    console.log(`[WEBHOOK] Skipping — instance ${instance.name} is ${instStatus}`);
    res.status(200).json({ success: true, skipped: 'instance_not_connected' }); return;
  }

  if (event === 'connection.update') {
    await handleConnectionUpdate(req, res, instance, rawBody.data);
    return;
  }

  if (event === 'messages.upsert') {
    const parsedCtx = parseIncomingWebhookMessage(rawBody.data ?? {}, rawBody.sender, (instance as { phone_number?: string | null }).phone_number ?? null);
    if (!parsedCtx) { res.json({ success: true, handled: true, reason: 'self_message' }); return; }
    await dispatchIncomingMessage(req, instance, parsedCtx);
    res.status(200).json({ success: true, handled: true });
    return;
  }

  if (event === 'messages.receipt') {
    const key = rawBody.data?.key as { id?: string; remoteJid?: string } | undefined;
    const receipt = rawBody.data?.receipt as { id?: string; status?: string } | undefined;
    await dispatchMessageReceipt(req, instance, key ?? {}, receipt ?? {});
    res.status(200).json({ success: true, handled: true });
    return;
  }

  if (event === 'presence.update') {
    const remoteJid = (rawBody.data?.remoteJid as string) || '';
    const presence = String(rawBody.data?.presence || (rawBody.data as Record<string, unknown>)?.status || '');
    const isGroup = remoteJid.includes('@g.us');
    const phone = remoteJid ? extractPhoneFromJid(remoteJid) : null;
    const chatId = isGroup ? remoteJid : (phone ? phone : remoteJid);
    const participant = (rawBody.data?.participant as string) || remoteJid;
    const fromName = participant ? extractPhoneFromJid(participant) : null;
    if (chatId && presence) {
      const { emitPresence } = await import('../utils/gateway.js');
      emitPresence(instance.name, chatId, presence, fromName);
    }
    res.status(200).json({ success: true, handled: true });
    return;
  }

  res.status(200).json({ success: true, handled: false });
}

async function handleConnectionUpdate(req: Request, res: Response, instance: Instance & { client_id: string }, data: Record<string, unknown> | undefined): Promise<void> {
  const state = data?.state as string | undefined;
  const wuid = data?.wuid as string | undefined;

  let status: 'connected' | 'connecting' | 'disconnected' = 'disconnected';
  if (state === 'open') status = 'connected';
  else if (state === 'connecting') status = 'connecting';

  let phoneNumber: string | null = wuid ? extractPhoneFromJid(wuid) : null;
  if (!phoneNumber && status === 'connected') {
    try {
      const evoName = (instance as { evolution_name?: string }).evolution_name || instance.name;
      const evoRes = await callGateway('GET', `/instance/connectionState/${evoName}`);
      const inst = (evoRes.instance as { state?: string; phone?: string; phone_number?: string } | undefined) || evoRes;
      phoneNumber = (inst?.phone as string | undefined) || (inst?.phone_number as string | undefined) || null;
    } catch { /* phone fetch failed */ }
  }

  db.prepare('UPDATE instances SET status = ?, phone_number = ?, last_active = ? WHERE name = ?')
    .run(status, phoneNumber, new Date().toISOString(), instance.name);
  logAuditAction(req, 'CONNECTION_STATE', 'instance', String(instance.id), `Webhook: ${instance.name} -> ${status}`);
  emitInstanceStateChange(instance.name, status, phoneNumber);

  if (status === 'connected') {
    syncGroupsForInstance(instance, instance.client_id).catch(err => console.error('[webhook] group sync failed:', err));
    const warmCtx: SendContext = { instance, client: { id: instance.client_id } as SendContext['client'], req: { headers: {} } as SendContext['req'] };
    mirrorChatList(warmCtx).then((r) => {
      const d = r.ok ? (r.data as { chats?: unknown[] } | undefined) : undefined;
      console.log(`[webhook] warm-up find-chats ok for ${instance.name}: ${d?.chats?.length ?? 0} chats`);
    }).catch(err => console.error('[webhook] warm-up find-chats failed:', err));
  } else if (status === 'disconnected') {
    try {
      const removed = cleanupPhonebookForInstance(String(instance.id), instance.client_id);
      if (removed > 0) console.log(`[webhook] phonebook cleanup: removed ${removed} synced contacts for ${instance.name}`);
      clearWhatsAppPacer(String(instance.id));
    } catch (err) { console.error('[webhook] phonebook cleanup failed:', err); }
  }

  res.status(200).json({ success: true, handled: true });
}
