/**
 * Normalize an inbound the gateway `messages.upsert` payload into DB-ready fields.
 *
 * the gateway (Baileys) nests every message type under a distinct key on
 * `data.message` (e.g. `imageMessage`, `audioMessage`, `locationMessage`).
 * This parser extracts display content + media + a typed `extra` blob for each,
 * and falls back to an `unknown` type so we never drop a message - the raw
 * payload is always stored alongside in `inbox_messages.raw_payload`.
 */

export interface ParsedMessage {
  messageType: string;
  content: string;
  mediaUrl: string | null;
  mediaMimetype: string | null;
  extra: Record<string, unknown>;
}

type Rec = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
const rec = (v: unknown): Rec | null => (v && typeof v === 'object' ? (v as Rec) : null);
const fieldStr = (o: Rec | null, k: string): string => (o ? str(o[k]) : '');

/** Prefer the S3/MinIO `mediaUrl` (set when media storage is configured). */
function resolveMediaUrl(msg: Rec, sub: Rec | null, urlKey = 'url'): string | null {
  if (typeof msg.mediaUrl === 'string') return msg.mediaUrl;
  return sub ? str(sub[urlKey]) || null : null;
}

export function parseIncomingMessage(data: Rec): ParsedMessage {
  const msg: Rec = rec(data.message) ?? {};
  const hint = str(data.messageType);

  // --- Text (plain or with link preview / reply) ---
  const ext = rec(msg.extendedTextMessage);
  if (msg.conversation || ext || hint === 'conversation' || hint === 'extendedTextMessage') {
    const text = str(msg.conversation) || fieldStr(ext, 'text');
    return { messageType: 'text', content: text, mediaUrl: null, mediaMimetype: null, extra: { text } };
  }

  // --- Image ---
  const img = rec(msg.imageMessage);
  if (img) {
    return { messageType: 'image', content: fieldStr(img, 'caption'), mediaUrl: resolveMediaUrl(msg, img),
      mediaMimetype: fieldStr(img, 'mimetype') || 'image/jpeg', extra: { caption: fieldStr(img, 'caption'), width: num(img.width), height: num(img.height) } };
  }
  // --- Video ---
  const vid = rec(msg.videoMessage);
  if (vid) {
    return { messageType: 'video', content: fieldStr(vid, 'caption'), mediaUrl: resolveMediaUrl(msg, vid),
      mediaMimetype: fieldStr(vid, 'mimetype') || 'video/mp4', extra: { caption: fieldStr(vid, 'caption'), seconds: num(vid.seconds) } };
  }
  // --- Document ---
  const doc = rec(msg.documentMessage);
  if (doc) {
    const fileName = fieldStr(doc, 'fileName') || fieldStr(doc, 'title');
    return { messageType: 'document', content: fileName, mediaUrl: resolveMediaUrl(msg, doc),
      mediaMimetype: fieldStr(doc, 'mimetype') || 'application/octet-stream', extra: { fileName, caption: fieldStr(doc, 'caption'), pageCount: num(doc.pageCount) } };
  }
  // --- Audio (voice note or audio file) ---
  const aud = rec(msg.audioMessage);
  if (aud) {
    return { messageType: 'audio', content: aud.ptt ? 'Voice message' : 'Audio', mediaUrl: resolveMediaUrl(msg, aud),
      mediaMimetype: fieldStr(aud, 'mimetype') || 'audio/ogg', extra: { seconds: num(aud.seconds), ptt: !!aud.ptt } };
  }
  // --- Sticker ---
  const stk = rec(msg.stickerMessage);
  if (stk) {
    return { messageType: 'sticker', content: 'Sticker', mediaUrl: resolveMediaUrl(msg, stk),
      mediaMimetype: fieldStr(stk, 'mimetype') || 'image/webp', extra: {} };
  }
  // --- Location ---
  const loc = rec(msg.locationMessage);
  if (loc) {
    const lat = num(loc.degreesLatitude);
    const lng = num(loc.degreesLongitude);
    const name = fieldStr(loc, 'name');
    const address = fieldStr(loc, 'address');
    return { messageType: 'location', content: `${name} ${address}`.trim() || `Location (${lat},${lng})`,
      mediaUrl: null, mediaMimetype: null, extra: { latitude: lat, longitude: lng, name, address } };
  }
  // --- Contact card (vCard) ---
  const con = rec(msg.contactMessage);
  if (con) {
    const name = fieldStr(con, 'displayName');
    return { messageType: 'contact', content: name, mediaUrl: null, mediaMimetype: null,
      extra: { displayName: name, vcard: fieldStr(con, 'vcard') } };
  }
  // --- Reaction ---
  const rct = rec(msg.reactionMessage);
  if (rct) {
    const emoji = str(rct.text) || str(rct.reaction);
    return { messageType: 'reaction', content: emoji || 'Reaction', mediaUrl: null, mediaMimetype: null, extra: { reaction: emoji } };
  }
  // --- Poll creation ---
  const poll = rec(msg.pollCreationMessage) || rec(msg.pollCreationMessageV3);
  if (poll) {
    const name = fieldStr(poll, 'name');
    return { messageType: 'poll', content: name, mediaUrl: null, mediaMimetype: null, extra: { name, options: poll.options } };
  }
  // --- List response ---
  const lr = rec(msg.listResponseMessage);
  if (lr) {
    const id = fieldStr(rec(lr.singleSelectReply), 'selectedRowId');
    return { messageType: 'list_response', content: fieldStr(lr, 'title') || fieldStr(lr, 'description') || id,
      mediaUrl: null, mediaMimetype: null, extra: { selectedRowId: id, title: fieldStr(lr, 'title'), description: fieldStr(lr, 'description') } };
  }
  // --- Button response ---
  const br = rec(msg.buttonsResponseMessage);
  if (br) {
    const id = fieldStr(br, 'selectedButtonId');
    return { messageType: 'button_response', content: fieldStr(br, 'selectedDisplayText') || id,
      mediaUrl: null, mediaMimetype: null, extra: { selectedButtonId: id } };
  }

  // --- Unknown - preserve the raw type hint so it's still searchable ---
  return { messageType: hint || 'unknown', content: '', mediaUrl: null, mediaMimetype: null, extra: { messageKeys: Object.keys(msg) } };
}
