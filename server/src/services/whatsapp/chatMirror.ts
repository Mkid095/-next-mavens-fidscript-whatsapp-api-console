/**
 * Live WhatsApp-Web mirror — turns the gateway's raw (untyped) Baileys JSON from
 * find-chats / find-messages into clean, typed shapes for the chat UI, and
 * resolves human-readable display names from saved contacts + group metadata.
 *
 * The display source of truth is the gateway; our DB only supplies name hints.
 * Message bodies are extracted by reusing parseIncomingMessage (same Baileys
 * blobs as the webhook path), so every message type is handled consistently.
 */

import db from '../../database.js';
import { normalizePhone } from '../../utils/phone.js';
import { parseIncomingMessage } from '../../utils/messageParser.js';
import { findChats, findMessagesAll, profilePicUrl } from './chats.js';
import { getCachedGroupInfo, getGroupParticipantName } from './groupSync.js';
import { paceWhatsAppCall } from './whatsappCallLimiter.js';
import type { SendContext, SendResult } from './shared.js';

type Rec = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const rec = (v: unknown): Rec | null => (v && typeof v === 'object' ? (v as Rec) : null);

/** Find the first Array under any of the given keys, or the value itself if array. */
function arrOf(data: unknown, keys: string[]): unknown[] {
  const root = rec(data);
  if (Array.isArray(data)) return data;
  if (!root) return [];
  for (const k of keys) {
    const v = root[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

/** Baileys timestamps are epoch SECONDS; normalise to epoch ms. */
function toMs(v: unknown): number | null {
  const n = num(v);
  if (n === null) return null;
  return n < 1e12 ? n * 1000 : n;
}

/** Read a remoteJid from a chat/message object, however the gateway nested it. */
function readJid(item: Rec): string {
  const direct = str(item.remoteJid) || str(item.id);
  if (direct.includes('@')) return direct;
  const idObj = rec(item.id) || rec(item.key);
  if (idObj && (str(idObj.user) || str(idObj.remoteJid))) {
    return str(idObj.remoteJid) || `${str(idObj.user)}@${str(idObj.server) || 's.whatsapp.net'}`;
  }
  return direct;
}

export interface ChatListItem {
  jid: string;
  name: string;
  isGroup: boolean;
  lastMessage: string;
  lastMessageAt: number | null;
  unread: number;
  profilePic: string | null;
}

export interface MirrorMessage {
  id: string;
  direction: 'incoming' | 'outgoing';
  type: string;
  content: string;
  mediaUrl: string | null;
  mediaMimetype: string | null;
  senderName: string | null;
  timestamp: number;
}

/**
 * Resolve a display name for a JID. Priority:
 *  1:1   → saved contact (by normalised phone) → pushName → phone → JID user
 *  group → cached group subject → pushName → JID
 */
function resolveDisplayName(workspaceId: string, jid: string, pushName?: string): string {
  if (jid.includes('@g.us')) {
    return getCachedGroupInfo(jid)?.subject || (pushName ? str(pushName) : '') || jid;
  }
  const rawPhone = jid.split('@')[0];
  // Contacts are stored with + prefix (via autoProvisionContact / extractPhoneFromJid)
  const phone = normalizePhone(rawPhone);
  if (phone) {
    const contact = db.prepare('SELECT name FROM contacts WHERE client_id = ? AND phone = ?')
      .get(workspaceId, phone) as { name: string | null } | undefined;
    if (contact?.name) return contact.name;
  }
  return (pushName ? str(pushName) : '') || phone.replace(/^\+/, '') || rawPhone;
}

/** Best-effort preview text for a chat from its (optional) last message blob. */
function previewText(lastMsg: Rec | null): string {
  if (!lastMsg) return '';
  const parsed = parseIncomingMessage({ message: lastMsg.message, messageType: lastMsg.messageType });
  if (parsed.content) return parsed.content;
  return parsed.messageType === 'text' ? '' : parsed.messageType;
}

/** POST /chat/findChats → clean chat list, newest first. */
export async function mirrorChatList(ctx: SendContext): Promise<SendResult> {
  await paceWhatsAppCall(ctx.instance.id); // pace the gateway→WhatsApp
  const result = await findChats(ctx);
  if (!result.ok) return result;

  const workspaceId = ctx.instance.client_id;
  // Evolution API returns a direct array of chats
  const raw = Array.isArray(result.data) ? result.data : arrOf(result.data, ['response', 'chats', 'data']);
  const items: ChatListItem[] = [];
  for (const entry of raw) {
    const c = rec(entry);
    if (!c) continue;
    const jid = readJid(c);
    if (!jid.includes('@')) continue;
    if (jid === 'status@broadcast' || jid.endsWith('@newsletter')) continue;

    const isGroup = jid.includes('@g.us');
    const lastMsgs = arrOf(c.messages, ['messages', 'lastMessage']);
    const lastBlob = rec(lastMsgs[0]) ?? rec(c.lastMessage);
    const ts = toMs(c.timestamp) ?? toMs(c.t) ?? (lastBlob ? toMs(lastBlob.messageTimestamp) : null);
    const pushName = str(c.name) || str(c.subject) || str(c.pushName) || undefined;

    items.push({
      jid,
      name: resolveDisplayName(workspaceId, jid, pushName),
      isGroup,
      lastMessage: previewText(lastBlob),
      lastMessageAt: ts,
      unread: num(c.unreadMessages) ?? num(c.unreadCount) ?? 0,
      profilePic: str(c.profilePicUrl) || null,
    });
  }

  items.sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
  return { ok: true, data: { chats: items } };
}

/** POST /chat/findMessages → clean thread (oldest→newest), capped at 200. */
export async function mirrorThread(ctx: SendContext, jid: string): Promise<SendResult> {
  await paceWhatsAppCall(ctx.instance.id); // pace the gateway→WhatsApp
  // Use findMessagesAll to fetch ALL pages — Evolution API's remoteJid filter is unreliable
  const result = await findMessagesAll(ctx);
  if (!result.ok) return result;

  const isGroup = jid.includes('@g.us');
  // findMessagesAll flattens all pages into result.data.messages array
  const d = rec(result.data);
  const raw: unknown[] = Array.isArray(d?.messages) ? d.messages as unknown[] : [];

  const byId = new Map<string, MirrorMessage>();

  // Client-side JID filter — Evolution API's where.remoteJid filter is unreliable.
  const targetJid = jid;
  for (const entry of raw) {
    const m = rec(entry);
    if (!m) continue;
    const key = rec(m.key);
    const msgJid = str(key?.remoteJid) || str(m.remoteJid) || '';
    if (msgJid !== targetJid) continue;

    const ts = toMs(m.messageTimestamp) ?? toMs(m.timestamp);
    const id = str(key?.id) || str(m.id) || (ts !== null ? `t${ts}` : '');
    if (!id || byId.has(id)) continue;

    const parsed = parseIncomingMessage({ message: m.message, messageType: m.messageType });
    if (ts === null) continue;

    // Drop empty protocol/system messages we can't render.
    const proto = parsed.messageType.includes('protocol') || parsed.messageType.includes('SenderKey') || parsed.messageType.includes('Revoke');
    if (proto && !parsed.content && !parsed.mediaUrl) continue;

    const fromMe = key?.fromMe === true || m.fromMe === true;
    let senderName: string | null = null;
    if (isGroup && !fromMe) {
      const participant = str(m.participant) || str(key?.participant);
      if (participant) senderName = getGroupParticipantName(jid, participant) || participant.split('@')[0];
    }

    byId.set(id, {
      id,
      direction: fromMe ? 'outgoing' : 'incoming',
      type: parsed.messageType,
      content: parsed.content,
      mediaUrl: parsed.mediaUrl,
      mediaMimetype: parsed.mediaMimetype,
      senderName,
      timestamp: ts,
    });
  }

  const messages = [...byId.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-200);
  return { ok: true, data: { messages } };
}

/** POST /chat/fetchProfilePictureUrl → the URL string (or null). */
export async function mirrorProfilePic(ctx: SendContext, number: string): Promise<SendResult> {
  await paceWhatsAppCall(ctx.instance.id); // pace the gateway→WhatsApp
  const result = await profilePicUrl(ctx, number);
  if (!result.ok) return result;
  const d = rec(result.data);
  const url = str(d?.profilePictureUrl) || str(d?.url) || (typeof d?.response === 'string' ? str(d.response) : '');
  return { ok: true, data: { url: url || null } };
}
