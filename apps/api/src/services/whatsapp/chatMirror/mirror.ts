/**
 * WhatsApp-Web mirror - turns raw Baileys JSON into clean typed shapes.
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

export async function mirrorChatList(ctx: SendContext, filter?: 'contacts' | 'groups' | 'outbox'): Promise<SendResult> {
  const workspaceId = ctx.instance.client_id;

  // Build WHERE clause based on tab filter
  const conditions: string[] = ['instance_id = ?', 'chat_id IS NOT NULL', "chat_id != ''"];
  if (filter === 'contacts') conditions.push('is_group = 0');
  else if (filter === 'groups') conditions.push('is_group = 1');
  else if (filter === 'outbox') conditions.push("lid = 'LID'");
  const whereClause = conditions.join(' AND ');

  // Primary: build chat list from inbox_messages (instant, no Evolution round-trip).
  // Group by chat_id so each distinct conversation appears once.
  const rows = db.prepare(`
    SELECT
      chat_id AS jid,
      MAX(timestamp) AS lastMessageAt,
      (SELECT content FROM inbox_messages m2
        WHERE m2.chat_id = m.chat_id AND m2.instance_id = m.instance_id
        ORDER BY timestamp DESC LIMIT 1) AS lastMessage,
      SUM(CASE WHEN direction = 'incoming' AND is_read = 0 THEN 1 ELSE 0 END) AS unread
    FROM inbox_messages m
    WHERE ${whereClause}
    GROUP BY chat_id
    ORDER BY lastMessageAt DESC
  `).all(ctx.instance.id) as {
    jid: string; lastMessageAt: string; lastMessage: string | null; unread: number;
  }[];

  const deduped: ChatListItem[] = rows.map((row) => ({
    jid: row.jid,
    name: resolveDisplayName(workspaceId, row.jid),
    isGroup: row.jid.includes('@g.us'),
    lastMessage: row.lastMessage || '',
    lastMessageAt: new Date(row.lastMessageAt).getTime(),
    unread: row.unread,
    profilePic: null,
    aiMode: null,
    isRestricted: false,
    isAdmin: false,
  }));

  // Batch-load group restrict/admin flags
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

  // Set aiMode to null for all items (AI override was a chatbot feature)
  for (const item of deduped) {
    item.aiMode = null;
  }

  // If DB is empty (brand-new QR scan, no messages yet), fall back to Evolution
  // so the UI still shows something on first connect.
  if (deduped.length === 0) {
    await paceWhatsAppCall(ctx.instance.id);
    const result = await findChats(ctx);
    if (!result.ok) return result;

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

    const lastByJid = new Map<string, ChatListItem>();
    for (const item of items) lastByJid.set(item.jid, item);
    const fallback = [...lastByJid.values()];
    fallback.sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
    return { ok: true, data: { chats: fallback } };
  }

  return { ok: true, data: { chats: deduped } };
}

export async function mirrorThread(ctx: SendContext, jid: string): Promise<SendResult> {
  // Primary: read from inbox_messages (both incoming from webhook + outgoing from finalize).
  // This is instant, unbounded, and works even when Evolution is unreachable.
  const rows = db.prepare(`
    SELECT id, direction, message_type, content, media_url,
           from_number, from_name, timestamp, is_group, extra
    FROM inbox_messages
    WHERE instance_id = ? AND chat_id = ? AND direction != 'system'
    ORDER BY timestamp ASC
    LIMIT 500
  `).all(ctx.instance.id, jid) as {
    id: string; direction: string; message_type: string; content: string;
    media_url: string | null; from_number: string; from_name: string;
    timestamp: string; is_group: number; extra: string | null;
  }[];

  // If DB is empty (brand-new instance with no webhook events yet), fall back to
  // Evolution for this one chat so the thread shows something immediately.
  if (rows.length === 0) {
    await paceWhatsAppCall(ctx.instance.id);
    const result = await findMessagesAll(ctx, jid);
    if (!result.ok) return result;

    const isGroup = jid.includes('@g.us');
    const d = rec(result.data);
    const raw: unknown[] = Array.isArray(d?.messages) ? d.messages as unknown[] : [];

    const byId = new Map<string, MirrorMessage>();
    for (const entry of raw) {
      const m = rec(entry);
      if (!m) continue;
      const key = rec(m.key);
      const msgJid = str(key?.remoteJid) || str(m.remoteJid) || '';
      if (msgJid !== jid) continue;
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
        id, direction: fromMe ? 'outgoing' : 'incoming',
        type: parsed.messageType, content: parsed.content, mediaUrl: parsed.mediaUrl,
        mediaMimetype: parsed.mediaMimetype, senderName,
        senderJid: isGroup ? (str(m.participant) || str(key?.participant) || null) : null,
        timestamp: ts,
      });
    }
    const messages = [...byId.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-200);
    return { ok: true, data: { messages } };
  }

  // DB path: map to MirrorMessage shape
  const messages: MirrorMessage[] = rows.map((row) => {
    let extra: Record<string, unknown> = {};
    if (row.extra) { try { extra = JSON.parse(row.extra); } catch { /* ignore */ } }
    return {
      id: row.id,
      direction: row.direction as 'incoming' | 'outgoing',
      type: row.message_type,
      content: row.content,
      mediaUrl: row.media_url,
      mediaMimetype: extra.mediaMimetype as string | null ?? null,
      senderName: row.from_name || null,
      senderJid: row.from_number,
      timestamp: new Date(row.timestamp).getTime(),
    };
  });

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
