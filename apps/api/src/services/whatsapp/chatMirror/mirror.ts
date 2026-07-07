/**
 * WhatsApp-Web mirror — turns raw Baileys JSON into clean typed shapes.
 */
import db from '../../../database.js';
import { parseIncomingMessage } from '../../../utils/messageParser.js';
import { findChats, findMessagesAll, profilePicUrl } from '../chats.js';
import { getGroupParticipantName } from '../groupSync.js';
import { paceWhatsAppCall } from '../whatsappCallLimiter.js';
import type { SendContext, SendResult } from '../shared.js';
import type { ChatListItem, MirrorMessage, Rec } from './types.js';
import { arrOf, toMs, readJid, rec, str } from './types.js';
import { resolveDisplayName } from './nameResolver.js';

// ---------------------------------------------------------------------------
// Best-effort preview text from a last-message blob
// ---------------------------------------------------------------------------

function previewText(lastMsg: Rec | null): string {
  if (!lastMsg) return '';
  const parsed = parseIncomingMessage({ message: lastMsg.message, messageType: lastMsg.messageType });
  if (parsed.content) return parsed.content;
  return parsed.messageType === 'text' ? '' : parsed.messageType;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function mirrorChatList(ctx: SendContext): Promise<SendResult> {
  await paceWhatsAppCall(ctx.instance.id);
  const result = await findChats(ctx);
  if (!result.ok) return result;

  const workspaceId = ctx.instance.client_id;
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
      unread: 0,
      profilePic: str(c.profilePicUrl) || null,
      aiMode: null,
      isRestricted: false,
      isAdmin: false,
    });
  }

  // Deduplicate by JID — last-write-wins so the most-recent entry wins
  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    if (seen.has(item.jid)) return false;
    seen.add(item.jid);
    return true;
  });

  // Compute unread from inbox_messages table
  if (deduped.length > 0) {
    const phoneToIndex: Record<string, number> = {};
    for (let i = 0; i < deduped.length; i++) {
      const jid = deduped[i].jid;
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
    for (const item of deduped) item.unread = 0;
    for (const r of unreadRows) {
      const phone = r.chat_id.replace('@s.whatsapp.net', '').replace(/^\+/, '');
      const idx = phoneToIndex[phone];
      if (idx !== undefined) deduped[idx].unread = r.cnt;
    }
  }

  // Batch-load group restrict/admin flags
  if (deduped.length > 0) {
    const groupItems = deduped.filter((i) => i.isGroup);
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

  // Batch-load AI override modes
  if (deduped.length > 0) {
    const jids = deduped.map((i) => i.jid);
    const placeholders = jids.map(() => '?').join(',');
    const rows = db.prepare(
      `SELECT conversation_id, mode FROM chatbot_conversation_overrides WHERE conversation_id IN (${placeholders})`
    ).all(...jids) as { conversation_id: string; mode: string }[];
    const overrideMap = new Map(rows.map((r) => [r.conversation_id, r.mode as 'ai' | 'manual']));
    for (const item of deduped) {
      item.aiMode = overrideMap.get(item.jid) ?? null;
    }
  }

  deduped.sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
  return { ok: true, data: { chats: deduped } };
}

export async function mirrorThread(ctx: SendContext, jid: string): Promise<SendResult> {
  await paceWhatsAppCall(ctx.instance.id);
  const result = await findMessagesAll(ctx);
  if (!result.ok) return result;

  const isGroup = jid.includes('@g.us');
  const d = rec(result.data);
  const raw: unknown[] = Array.isArray(d?.messages) ? d.messages as unknown[] : [];

  const byId = new Map<string, MirrorMessage>();
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

export async function mirrorProfilePic(ctx: SendContext, number: string): Promise<SendResult> {
  await paceWhatsAppCall(ctx.instance.id);
  const result = await profilePicUrl(ctx, number);
  if (!result.ok) return result;
  const d = rec(result.data);
  const url = str(d?.profilePictureUrl) || str(d?.url) || (typeof d?.response === 'string' ? str(d.response) : '');
  return { ok: true, data: { url: url || null } };
}
