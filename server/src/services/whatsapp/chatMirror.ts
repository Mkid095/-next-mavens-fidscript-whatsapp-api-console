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
import { getContactDisplayName } from '../contactResolver.js';
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
  aiMode: 'ai' | 'manual' | null;
  isRestricted: boolean; // true = only admins can send (group restrict flag)
  isAdmin: boolean;      // true = our instance is an admin in this group
}

export interface MirrorMessage {
  id: string;
  direction: 'incoming' | 'outgoing';
  type: string;
  content: string;
  mediaUrl: string | null;
  mediaMimetype: string | null;
  senderName: string | null;
  /** Full JID of the sender — used for group avatar lookup on the frontend */
  senderJid: string | null;
  timestamp: number;
}

/**
 * Resolve a display name for a JID. Priority:
 *  1:1   → CRM name (user-defined) → WhatsApp profile name → raw phone number
 *  group → cached group subject → pushName (Evolution API group subject) → JID
 *
 * Uses the canonical contactResolver for 1:1 lookups, so name resolution is
 * consistent everywhere: manual name → whatsapp_name → google_name → phone.
 */
function resolveDisplayName(workspaceId: string, jid: string, pushName?: string): string {
  if (jid.includes('@g.us')) {
    // Groups: cached subject → group subject from Evolution API (pushName) → JID
    const cached = getCachedGroupInfo(jid);
    if (cached?.subject) return cached.subject;
    if (pushName) return pushName;
    return jid;
  }
  // 1:1: resolve via canonical contact identity layer
  const rawPhone = jid.split('@')[0];
  if (/^\d+$/.test(rawPhone)) {
    const normalizedForDb = normalizePhone(rawPhone);
    if (normalizedForDb) {
      // Use contactResolver to find the contact by phone, then get canonical display name
      const contact = db.prepare(`
        SELECT ci.contact_id FROM contact_identifiers ci
        JOIN contacts c ON c.id = ci.contact_id
        WHERE ci.type = 'phone' AND ci.value = ? AND c.client_id = ?
        LIMIT 1
      `).get(normalizedForDb, workspaceId) as { contact_id: string } | undefined;
      if (contact) {
        const resolvedName = getContactDisplayName(contact.contact_id);
        if (resolvedName) return resolvedName;
      }
    }
  }
  // Fall back to raw phone digits — exactly as the JID stores them
  return rawPhone;
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
      unread: 0, // computed from inbox_messages below
      profilePic: str(c.profilePicUrl) || null,
      aiMode: null, // populated below from chatbot_conversation_overrides
      isRestricted: false,
      isAdmin: false,
    });
  }

  // Compute unread from our own inbox_messages table — ground truth, not Evolution API.
  // inbox_messages stores chat_id as a normalized phone (+254...) while findChats
  // returns full JIDs (254...@s.whatsapp.net), so we normalize both sides before matching.
  if (items.length > 0) {
    // Build a map from normalized phone → index
    const phoneToIndex: Record<string, number> = {};
    for (let i = 0; i < items.length; i++) {
      const jid = items[i].jid;
      const phone = jid.includes('@')
        ? jid.replace('@s.whatsapp.net', '').replace(/^\+/, '')
        : jid.replace(/^\+/, '');
      phoneToIndex[phone] = i;
    }
    const normalizedJids = Object.keys(phoneToIndex);
    const placeholders = normalizedJids.map(() => '?').join(',');
    const unreadRows = db.prepare(`
      SELECT chat_id, COUNT(*) as cnt
      FROM inbox_messages
      WHERE instance_id = ? AND is_read = 0 AND direction = 'incoming'
        AND REPLACE(REPLACE(chat_id, '+', ''), '@s.whatsapp.net', '') IN (${placeholders})
      GROUP BY chat_id
    `).all(ctx.instance.id, ...normalizedJids) as { chat_id: string; cnt: number }[];
    // Initialize all items to 0
    for (const item of items) item.unread = 0;
    for (const r of unreadRows) {
      const phone = r.chat_id.replace('@s.whatsapp.net', '').replace(/^\+/, '');
      const idx = phoneToIndex[phone];
      if (idx !== undefined) items[idx].unread = r.cnt;
    }
  }

  // Batch-load restrict/admin flags for group JIDs from cached_group_info
  if (items.length > 0) {
    const groupItems = items.filter((i) => i.isGroup);
    if (groupItems.length > 0) {
      const groupJids = groupItems.map((i) => i.jid);
      const placeholders = groupJids.map(() => '?').join(',');
      const rows = db.prepare(
        `SELECT group_jid, restrict, self_is_admin FROM cached_group_info WHERE group_jid IN (${placeholders})`
      ).all(...groupJids) as { group_jid: string; restrict: number; self_is_admin: number }[];
      const flagsMap = new Map(rows.map((r) => [r.group_jid, { restrict: r.restrict === 1, self_is_admin: r.self_is_admin === 1 }]));
      for (const item of groupItems) {
        const flags = flagsMap.get(item.jid);
        if (flags) {
          item.isRestricted = flags.restrict;
          item.isAdmin = flags.self_is_admin;
        }
      }
    }
  }

  // Batch-load AI override modes for all JIDs in one query — no N+1
  if (items.length > 0) {
    const jids = items.map((i) => i.jid);
    const placeholders = jids.map(() => '?').join(',');
    const rows = db.prepare(
      `SELECT conversation_id, mode FROM chatbot_conversation_overrides WHERE conversation_id IN (${placeholders})`
    ).all(...jids) as { conversation_id: string; mode: string }[];
    const overrideMap = new Map(rows.map((r) => [r.conversation_id, r.mode as 'ai' | 'manual']));
    for (const item of items) {
      item.aiMode = overrideMap.get(item.jid) ?? null;
    }
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
      senderJid: isGroup ? (str(m.participant) || str(key?.participant) || null) : null,
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
