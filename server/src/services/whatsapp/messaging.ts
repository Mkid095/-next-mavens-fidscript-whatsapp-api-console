import { v4 as uuidv4 } from 'uuid';
import { callEvolutionAPIChecked } from '../../utils/evolution.js';
import {
  TOKEN_COST_TEXT, TOKEN_COST_MEDIA, TOKEN_COST_LOCATION, TOKEN_COST_CONTACT,
  TOKEN_COST_REACTION, TOKEN_COST_POLL, TOKEN_COST_LIST, TOKEN_COST_AUDIO,
  TOKEN_COST_STICKER, TOKEN_COST_STATUS,
} from '../../utils/tokenCosts.js';
import {
  type SendContext, type SendResult, type ContactCard, type MessageKey, type ListSection,
  evolutionName, requireConnected, chargeAndEmit, refundTokens, finalize, wrapSend,
} from './shared.js';

const newMsgId = () => `msg_${uuidv4().substring(0, 12)}`;
const now = () => new Date().toISOString();
const INSUFFICIENT: SendResult = { ok: false, status: 402, error: 'Insufficient token balance' };
const blockOr = (ctx: SendContext): SendResult | null => requireConnected(ctx);

/** Coerce a nested Evolution error value into a readable string. */
function asString(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(asString).filter(Boolean).join('; ') || null;
  return null;
}

/**
 * Pull the human-readable message out of an Evolution error body. Evolution
 * returns validation failures as { error: "Bad Request", response: { message:
 * [["field does not meet minimum length of 1"]] } } — the useful detail is
 * nested under response.message as an array of arrays, NOT in the top-level
 * `error` (which is just the HTTP status text). Without this we surfaced only
 * "Bad Request" and hid the real cause.
 */
function extractEvolutionError(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const resp = d.response as Record<string, unknown> | undefined;
  return asString(resp?.message) || asString(d.message) || asString(d.error);
}

/** Map a failed gateway response into a standard SendResult error. */
function gatewayError(status: number, data: unknown, fallback: string): SendResult {
  return { ok: false, status, error: extractEvolutionError(data) || fallback };
}

export const sendText = wrapSend(async (ctx, args: { to: string; message: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_TEXT, `send_text_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  const res = await callEvolutionAPIChecked('POST', `/message/sendText/${evolutionName(ctx)}`, { number: args.to, text: args.message });
  if (!res.ok) { refundTokens(ctx, TOKEN_COST_TEXT, `refund_send_text_${ctx.instance.name}`); return gatewayError(res.status, res.data, 'Failed to send text'); }
  await finalize(ctx, msgId, args.to, args.message, 'text', undefined, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, message: args.message, timestamp: now() } };
});

export const sendMedia = wrapSend(async (ctx, args: { to: string; media_url: string; media_type?: string; caption?: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_MEDIA, `send_media_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  const msgType = args.media_type || 'image';
  const res = await callEvolutionAPIChecked('POST', `/message/sendMedia/${evolutionName(ctx)}`, { number: args.to, mediatype: msgType, media: args.media_url, caption: args.caption || '', fileName: args.media_url.split('/').pop() || 'file' });
  if (!res.ok) { refundTokens(ctx, TOKEN_COST_MEDIA, `refund_send_media_${ctx.instance.name}`); return gatewayError(res.status, res.data, 'Failed to send media'); }
  await finalize(ctx, msgId, args.to, args.caption || '', msgType, args.media_url, JSON.stringify({ msgId, to: args.to, media_type: msgType }));
  return { ok: true, data: { messageId: msgId, to: args.to, media_url: args.media_url, media_type: msgType, caption: args.caption, timestamp: now() } };
});

export const sendLocation = wrapSend(async (ctx, args: { to: string; latitude: number; longitude: number; name?: string; address?: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_LOCATION, `send_location_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  const res = await callEvolutionAPIChecked('POST', `/message/sendLocation/${evolutionName(ctx)}`, { number: args.to, latitude: args.latitude, longitude: args.longitude, name: args.name || '', address: args.address || '' });
  if (!res.ok) { refundTokens(ctx, TOKEN_COST_LOCATION, `refund_send_location_${ctx.instance.name}`); return gatewayError(res.status, res.data, 'Failed to send location'); }
  const content = `${args.name || ''} ${args.address || ''} (${args.latitude},${args.longitude})`.trim();
  await finalize(ctx, msgId, args.to, content, 'location', undefined, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, location: { latitude: args.latitude, longitude: args.longitude, name: args.name, address: args.address }, timestamp: now() } };
});

export const sendContact = wrapSend(async (ctx, args: { to: string; contact: ContactCard[] }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_CONTACT, `send_contact_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  const res = await callEvolutionAPIChecked('POST', `/message/sendContact/${evolutionName(ctx)}`, { number: args.to, contact: args.contact });
  if (!res.ok) { refundTokens(ctx, TOKEN_COST_CONTACT, `refund_send_contact_${ctx.instance.name}`); return gatewayError(res.status, res.data, 'Failed to send contact'); }
  const contactName = args.contact[0]?.fullName || 'Contact';
  await finalize(ctx, msgId, args.to, contactName, 'contact', undefined, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, contact: args.contact[0], timestamp: now() } };
});

export const sendReaction = wrapSend(async (ctx, args: { to: string; key: MessageKey; reaction: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_REACTION, `send_reaction_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  const res = await callEvolutionAPIChecked('POST', `/message/sendReaction/${evolutionName(ctx)}`, { key: args.key, reaction: args.reaction });
  if (!res.ok) { refundTokens(ctx, TOKEN_COST_REACTION, `refund_send_reaction_${ctx.instance.name}`); return gatewayError(res.status, res.data, 'Failed to send reaction'); }
  await finalize(ctx, msgId, args.to, args.reaction, 'reaction', undefined, JSON.stringify({ msgId, to: args.to, reaction: args.reaction }));
  return { ok: true, data: { messageId: msgId, to: args.to, reaction: args.reaction, timestamp: now() } };
});

export const sendPoll = wrapSend(async (ctx, args: { to: string; name: string; selectableCount: number; values: string[] }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_POLL, `send_poll_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  const res = await callEvolutionAPIChecked('POST', `/message/sendPoll/${evolutionName(ctx)}`, { number: args.to, name: args.name, selectableCount: args.selectableCount, values: args.values });
  if (!res.ok) { refundTokens(ctx, TOKEN_COST_POLL, `refund_send_poll_${ctx.instance.name}`); return gatewayError(res.status, res.data, 'Failed to send poll'); }
  await finalize(ctx, msgId, args.to, args.name, 'poll', undefined, JSON.stringify({ msgId, to: args.to, name: args.name }));
  return { ok: true, data: { messageId: msgId, to: args.to, poll: { name: args.name, selectableCount: args.selectableCount, values: args.values }, timestamp: now() } };
});

export const sendList = wrapSend(async (ctx, args: { to: string; title: string; description?: string; buttonText: string; footerText?: string; sections: ListSection[] }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_LIST, `send_list_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  const res = await callEvolutionAPIChecked('POST', `/message/sendList/${evolutionName(ctx)}`, { number: args.to, title: args.title, description: args.description || '', buttonText: args.buttonText, footerText: args.footerText || '', sections: args.sections });
  if (!res.ok) { refundTokens(ctx, TOKEN_COST_LIST, `refund_send_list_${ctx.instance.name}`); return gatewayError(res.status, res.data, 'Failed to send list message'); }
  await finalize(ctx, msgId, args.to, args.title, 'list', undefined, JSON.stringify({ msgId, to: args.to, title: args.title }));
  return { ok: true, data: { messageId: msgId, to: args.to, list: { title: args.title, description: args.description, buttonText: args.buttonText, footerText: args.footerText, sections: args.sections }, timestamp: now() } };
});

export const sendAudio = wrapSend(async (ctx, args: { to: string; audio: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_AUDIO, `send_audio_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  const res = await callEvolutionAPIChecked('POST', `/message/sendWhatsAppAudio/${evolutionName(ctx)}`, { number: args.to, audio: args.audio });
  if (!res.ok) { refundTokens(ctx, TOKEN_COST_AUDIO, `refund_send_audio_${ctx.instance.name}`); return gatewayError(res.status, res.data, 'Failed to send audio'); }
  await finalize(ctx, msgId, args.to, 'Voice message', 'audio', args.audio, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, audio: args.audio, timestamp: now() } };
});

export const sendSticker = wrapSend(async (ctx, args: { to: string; sticker: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_STICKER, `send_sticker_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  const res = await callEvolutionAPIChecked('POST', `/message/sendSticker/${evolutionName(ctx)}`, { number: args.to, sticker: args.sticker });
  if (!res.ok) { refundTokens(ctx, TOKEN_COST_STICKER, `refund_send_sticker_${ctx.instance.name}`); return gatewayError(res.status, res.data, 'Failed to send sticker'); }
  await finalize(ctx, msgId, args.to, 'Sticker', 'sticker', args.sticker, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, sticker: args.sticker, timestamp: now() } };
});

export const sendStatus = wrapSend(async (ctx, args: { type: 'text' | 'image' | 'audio'; content: string; caption?: string; backgroundColor?: string; font?: number; allContacts?: boolean; statusJidList?: string[] }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_STATUS, `send_status_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  // Evolution validates statusJidList length >= 1 EVEN when allContacts=true
  // (the docs example ships allContacts:true with a non-empty list). When the
  // caller did not specify recipients, seed the list with the sender's own JID;
  // with allContacts=true the list contents are ignored for delivery, so the
  // broadcast still reaches every contact — it just satisfies the validator.
  let statusJidList = args.statusJidList && args.statusJidList.length ? args.statusJidList : [];
  if (statusJidList.length === 0) {
    const self = (ctx.instance as { phone_number?: string | null }).phone_number;
    if (self) statusJidList = [self.includes('@') ? self : `${self.replace(/\D/g, '')}@s.whatsapp.net`];
  }
  const res = await callEvolutionAPIChecked('POST', `/message/sendStatus/${evolutionName(ctx)}`, {
    type: args.type, content: args.content, caption: args.caption || '',
    backgroundColor: args.backgroundColor || '#008000', font: args.font ?? 1,
    allContacts: args.allContacts ?? true, statusJidList,
  });
  if (!res.ok) { refundTokens(ctx, TOKEN_COST_STATUS, `refund_send_status_${ctx.instance.name}`); return gatewayError(res.status, res.data, 'Failed to send status'); }
  await finalize(ctx, msgId, 'status', args.content, 'status', args.type === 'image' ? args.content : undefined, JSON.stringify({ msgId, type: args.type }));
  return { ok: true, data: { messageId: msgId, type: args.type, content: args.content, timestamp: now() } };
});
