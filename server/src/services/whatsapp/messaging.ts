import { v4 as uuidv4 } from 'uuid';
import { callEvolutionAPI } from '../../utils/evolution.js';
import {
  TOKEN_COST_TEXT, TOKEN_COST_MEDIA, TOKEN_COST_LOCATION, TOKEN_COST_CONTACT,
  TOKEN_COST_REACTION, TOKEN_COST_POLL, TOKEN_COST_LIST, TOKEN_COST_AUDIO,
  TOKEN_COST_STICKER, TOKEN_COST_STATUS,
} from '../../utils/tokenCosts.js';
import {
  type SendContext, type SendResult, type ContactCard, type MessageKey, type ListSection,
  evolutionName, requireConnected, chargeAndEmit, finalize, wrapSend,
} from './shared.js';

const newMsgId = () => `msg_${uuidv4().substring(0, 12)}`;
const now = () => new Date().toISOString();
const INSUFFICIENT: SendResult = { ok: false, status: 402, error: 'Insufficient token balance' };
const blockOr = (ctx: SendContext): SendResult | null => requireConnected(ctx);

export const sendText = wrapSend(async (ctx, args: { to: string; message: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_TEXT, `send_text_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  await callEvolutionAPI('POST', `/message/sendText/${evolutionName(ctx)}`, { number: args.to, text: args.message });
  finalize(ctx, msgId, args.to, args.message, 'text', undefined, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, message: args.message, timestamp: now() } };
});

export const sendMedia = wrapSend(async (ctx, args: { to: string; media_url: string; media_type?: string; caption?: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_MEDIA, `send_media_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  const msgType = args.media_type || 'image';
  await callEvolutionAPI('POST', `/message/sendMedia/${evolutionName(ctx)}`, { number: args.to, mediatype: msgType, media: args.media_url, caption: args.caption || '', fileName: args.media_url.split('/').pop() || 'file' });
  finalize(ctx, msgId, args.to, args.caption || '', msgType, args.media_url, JSON.stringify({ msgId, to: args.to, media_type: msgType }));
  return { ok: true, data: { messageId: msgId, to: args.to, media_url: args.media_url, media_type: msgType, caption: args.caption, timestamp: now() } };
});

export const sendLocation = wrapSend(async (ctx, args: { to: string; latitude: number; longitude: number; name?: string; address?: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_LOCATION, `send_location_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  await callEvolutionAPI('POST', `/message/sendLocation/${evolutionName(ctx)}`, { number: args.to, latitude: args.latitude, longitude: args.longitude, name: args.name || '', address: args.address || '' });
  const content = `${args.name || ''} ${args.address || ''} (${args.latitude},${args.longitude})`.trim();
  finalize(ctx, msgId, args.to, content, 'location', undefined, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, location: { latitude: args.latitude, longitude: args.longitude, name: args.name, address: args.address }, timestamp: now() } };
});

export const sendContact = wrapSend(async (ctx, args: { to: string; contact: ContactCard[] }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_CONTACT, `send_contact_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  await callEvolutionAPI('POST', `/message/sendContact/${evolutionName(ctx)}`, { number: args.to, contact: args.contact });
  const contactName = args.contact[0]?.fullName || 'Contact';
  finalize(ctx, msgId, args.to, contactName, 'contact', undefined, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, contact: args.contact[0], timestamp: now() } };
});

export const sendReaction = wrapSend(async (ctx, args: { to: string; key: MessageKey; reaction: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_REACTION, `send_reaction_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  await callEvolutionAPI('POST', `/message/sendReaction/${evolutionName(ctx)}`, { key: args.key, reaction: args.reaction });
  finalize(ctx, msgId, args.to, args.reaction, 'reaction', undefined, JSON.stringify({ msgId, to: args.to, reaction: args.reaction }));
  return { ok: true, data: { messageId: msgId, to: args.to, reaction: args.reaction, timestamp: now() } };
});

export const sendPoll = wrapSend(async (ctx, args: { to: string; name: string; selectableCount: number; values: string[] }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_POLL, `send_poll_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  await callEvolutionAPI('POST', `/message/sendPoll/${evolutionName(ctx)}`, { number: args.to, name: args.name, selectableCount: args.selectableCount, values: args.values });
  finalize(ctx, msgId, args.to, args.name, 'poll', undefined, JSON.stringify({ msgId, to: args.to, name: args.name }));
  return { ok: true, data: { messageId: msgId, to: args.to, poll: { name: args.name, selectableCount: args.selectableCount, values: args.values }, timestamp: now() } };
});

export const sendList = wrapSend(async (ctx, args: { to: string; title: string; description?: string; buttonText: string; footerText?: string; sections: ListSection[] }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_LIST, `send_list_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  await callEvolutionAPI('POST', `/message/sendList/${evolutionName(ctx)}`, { number: args.to, title: args.title, description: args.description || '', buttonText: args.buttonText, footerText: args.footerText || '', sections: args.sections });
  finalize(ctx, msgId, args.to, args.title, 'list', undefined, JSON.stringify({ msgId, to: args.to, title: args.title }));
  return { ok: true, data: { messageId: msgId, to: args.to, list: { title: args.title, description: args.description, buttonText: args.buttonText, footerText: args.footerText, sections: args.sections }, timestamp: now() } };
});

export const sendAudio = wrapSend(async (ctx, args: { to: string; audio: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_AUDIO, `send_audio_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  await callEvolutionAPI('POST', `/message/sendWhatsAppAudio/${evolutionName(ctx)}`, { number: args.to, audio: args.audio });
  finalize(ctx, msgId, args.to, 'Voice message', 'audio', args.audio, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, audio: args.audio, timestamp: now() } };
});

export const sendSticker = wrapSend(async (ctx, args: { to: string; sticker: string }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_STICKER, `send_sticker_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  await callEvolutionAPI('POST', `/message/sendSticker/${evolutionName(ctx)}`, { number: args.to, sticker: args.sticker });
  finalize(ctx, msgId, args.to, 'Sticker', 'sticker', args.sticker, JSON.stringify({ msgId, to: args.to }));
  return { ok: true, data: { messageId: msgId, to: args.to, sticker: args.sticker, timestamp: now() } };
});

export const sendStatus = wrapSend(async (ctx, args: { type: 'text' | 'image' | 'audio'; content: string; caption?: string; backgroundColor?: string; font?: number; allContacts?: boolean; statusJidList?: string[] }): Promise<SendResult> => {
  const blocked = blockOr(ctx); if (blocked) return blocked;
  if (!chargeAndEmit(ctx, TOKEN_COST_STATUS, `send_status_${ctx.instance.name}`)) return INSUFFICIENT;
  const msgId = newMsgId();
  await callEvolutionAPI('POST', `/message/sendStatus/${evolutionName(ctx)}`, {
    type: args.type, content: args.content, caption: args.caption || '',
    backgroundColor: args.backgroundColor || '#008000', font: args.font ?? 1,
    allContacts: args.allContacts ?? true, statusJidList: args.statusJidList || [],
  });
  finalize(ctx, msgId, 'status', args.content, 'status', args.type === 'image' ? args.content : undefined, JSON.stringify({ msgId, type: args.type }));
  return { ok: true, data: { messageId: msgId, type: args.type, content: args.content, timestamp: now() } };
});
