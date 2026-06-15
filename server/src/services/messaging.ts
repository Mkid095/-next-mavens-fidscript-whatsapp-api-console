import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import db from '../database.js';
import type { Instance, Client } from '../types.js';
import { callEvolutionAPI, emitTokenUpdate } from '../utils/evolution.js';
import { logApiRequest } from '../utils/audit.js';
import { emitDashboardRefresh } from '../utils/dashboardEmitter.js';
import {
  TOKEN_COST_TEXT, TOKEN_COST_MEDIA, TOKEN_COST_LOCATION,
  TOKEN_COST_CONTACT, TOKEN_COST_REACTION, TOKEN_COST_POLL, TOKEN_COST_LIST,
} from '../utils/tokenCosts.js';

export interface SendContext {
  instance: Instance & { client_id: string };
  client: Client;
  req: Request;
}

export type SendResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; error: string };

export interface ContactCard { fullName: string; wuid: string; phoneNumber: string; organization?: string; }
export interface MessageKey { remoteJid: string; fromMe: boolean; id: string; }
export interface ListSectionRow { title: string; description?: string; rowId: string; }
export interface ListSection { title: string; rows: ListSectionRow[]; }

/** Load an instance owned by a client, client_id resolved to a string. */
export function getInstanceForClient(name: string, clientId: string): (Instance & { client_id: string }) | null {
  const row = db.prepare(`
    SELECT i.*, c.id AS client_id
    FROM instances i JOIN clients c ON i.client_id = c.id
    WHERE i.name = ? AND i.client_id = ?
  `).get(name, clientId) as (Instance & { client_id: string }) | undefined;
  return row ?? null;
}

function deductTokens(clientId: string, amount: number, reference: string): boolean {
  const client = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(clientId) as { token_balance: number } | undefined;
  if (!client || client.token_balance < amount) return false;
  db.prepare('UPDATE clients SET token_balance = token_balance - ? WHERE id = ?').run(amount, clientId);
  db.prepare('INSERT INTO token_transactions (id, client_id, type, amount, reference) VALUES (?, ?, ?, ?, ?)')
    .run(`txn_${uuidv4().substring(0, 8)}`, clientId, 'sent', -amount, reference);
  return true;
}

function chargeAndEmit(ctx: SendContext, cost: number, reference: string): boolean {
  if (!deductTokens(ctx.instance.client_id, cost, reference)) return false;
  const updated = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(ctx.instance.client_id) as { token_balance: number };
  emitTokenUpdate(ctx.instance.name, updated?.token_balance ?? 0);
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

const evolutionName = (ctx: SendContext): string => ctx.instance.evolution_name || `${ctx.instance.client_id}_${ctx.instance.name}`;

function requireConnected(ctx: SendContext): SendResult | null {
  return ctx.instance.status === 'connected' ? null : { ok: false, status: 400, error: 'Instance is not connected' };
}

function finalize(ctx: SendContext, msgId: string, to: string, content: string, type: string, mediaUrl: string | undefined, logBody: string) {
  updateCounters(ctx.instance.name, ctx.instance.client_id);
  saveSentMessage(ctx.instance.id, ctx.instance.client_id, msgId, to, content, type, mediaUrl);
  logApiRequest(ctx.req, ctx.instance.id, ctx.instance.client_id, 200, logBody);
  emitDashboardRefresh(ctx.instance.client_id);
}

export async function sendText(ctx: SendContext, args: { to: string; message: string }): Promise<SendResult> {
  const blocked = requireConnected(ctx);
  if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_TEXT, `send_text_${ctx.instance.name}`)) return { ok: false, status: 402, error: 'Insufficient token balance' };
  const msgId = `msg_${uuidv4().substring(0, 12)}`;
  await callEvolutionAPI('POST', `/message/sendText/${evolutionName(ctx)}`, { number: args.to, text: args.message });
  finalize(ctx, msgId, args.to, args.message, 'text', undefined, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, message: args.message, timestamp: new Date().toISOString() } };
}

export async function sendMedia(ctx: SendContext, args: { to: string; media_url: string; media_type?: string; caption?: string }): Promise<SendResult> {
  const blocked = requireConnected(ctx);
  if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_MEDIA, `send_media_${ctx.instance.name}`)) return { ok: false, status: 402, error: 'Insufficient token balance' };
  const msgId = `msg_${uuidv4().substring(0, 12)}`;
  const msgType = args.media_type || 'image';
  await callEvolutionAPI('POST', `/message/sendMedia/${evolutionName(ctx)}`, { number: args.to, mediatype: msgType, media: args.media_url, caption: args.caption || '' });
  finalize(ctx, msgId, args.to, args.caption || '', msgType, args.media_url, JSON.stringify({ msgId, to: args.to, media_type: msgType }));
  return { ok: true, data: { messageId: msgId, to: args.to, media_url: args.media_url, media_type: msgType, caption: args.caption, timestamp: new Date().toISOString() } };
}

export async function sendLocation(ctx: SendContext, args: { to: string; latitude: number; longitude: number; name?: string; address?: string }): Promise<SendResult> {
  const blocked = requireConnected(ctx);
  if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_LOCATION, `send_location_${ctx.instance.name}`)) return { ok: false, status: 402, error: 'Insufficient token balance' };
  const msgId = `msg_${uuidv4().substring(0, 12)}`;
  await callEvolutionAPI('POST', `/message/sendLocation/${evolutionName(ctx)}`, { number: args.to, latitude: args.latitude, longitude: args.longitude, name: args.name || '', address: args.address || '' });
  const content = `${args.name || ''} ${args.address || ''} (${args.latitude},${args.longitude})`;
  finalize(ctx, msgId, args.to, content, 'location', undefined, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, location: { latitude: args.latitude, longitude: args.longitude, name: args.name, address: args.address }, timestamp: new Date().toISOString() } };
}

export async function sendContact(ctx: SendContext, args: { to: string; contact: ContactCard[] }): Promise<SendResult> {
  const blocked = requireConnected(ctx);
  if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_CONTACT, `send_contact_${ctx.instance.name}`)) return { ok: false, status: 402, error: 'Insufficient token balance' };
  const msgId = `msg_${uuidv4().substring(0, 12)}`;
  await callEvolutionAPI('POST', `/message/sendContact/${evolutionName(ctx)}`, { number: args.to, contact: args.contact });
  const contactName = args.contact[0]?.fullName || 'Contact';
  finalize(ctx, msgId, args.to, contactName, 'contact', undefined, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, contact: args.contact[0], timestamp: new Date().toISOString() } };
}

export async function sendReaction(ctx: SendContext, args: { to: string; key: MessageKey; reaction: string }): Promise<SendResult> {
  const blocked = requireConnected(ctx);
  if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_REACTION, `send_reaction_${ctx.instance.name}`)) return { ok: false, status: 402, error: 'Insufficient token balance' };
  const msgId = `msg_${uuidv4().substring(0, 12)}`;
  await callEvolutionAPI('POST', `/message/sendReaction/${evolutionName(ctx)}`, { key: args.key, reaction: args.reaction });
  finalize(ctx, msgId, args.to, args.reaction, 'reaction', undefined, JSON.stringify({ msgId, to: args.to, reaction: args.reaction }));
  return { ok: true, data: { messageId: msgId, to: args.to, reaction: args.reaction, timestamp: new Date().toISOString() } };
}

export async function sendPoll(ctx: SendContext, args: { to: string; name: string; selectableCount: number; values: string[] }): Promise<SendResult> {
  const blocked = requireConnected(ctx);
  if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_POLL, `send_poll_${ctx.instance.name}`)) return { ok: false, status: 402, error: 'Insufficient token balance' };
  const msgId = `msg_${uuidv4().substring(0, 12)}`;
  await callEvolutionAPI('POST', `/message/sendPoll/${evolutionName(ctx)}`, { number: args.to, name: args.name, selectableCount: args.selectableCount, values: args.values });
  finalize(ctx, msgId, args.to, args.name, 'poll', undefined, JSON.stringify({ msgId, to: args.to, name: args.name }));
  return { ok: true, data: { messageId: msgId, to: args.to, poll: { name: args.name, selectableCount: args.selectableCount, values: args.values }, timestamp: new Date().toISOString() } };
}

export async function sendList(ctx: SendContext, args: { to: string; title: string; description?: string; buttonText: string; footerText?: string; sections: ListSection[] }): Promise<SendResult> {
  const blocked = requireConnected(ctx);
  if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_LIST, `send_list_${ctx.instance.name}`)) return { ok: false, status: 402, error: 'Insufficient token balance' };
  const msgId = `msg_${uuidv4().substring(0, 12)}`;
  await callEvolutionAPI('POST', `/message/sendList/${evolutionName(ctx)}`, { number: args.to, title: args.title, description: args.description || '', buttonText: args.buttonText, footerText: args.footerText || '', sections: args.sections });
  finalize(ctx, msgId, args.to, args.title, 'list', undefined, JSON.stringify({ msgId, to: args.to, title: args.title }));
  return { ok: true, data: { messageId: msgId, to: args.to, list: { title: args.title, description: args.description, buttonText: args.buttonText, footerText: args.footerText, sections: args.sections }, timestamp: new Date().toISOString() } };
}
