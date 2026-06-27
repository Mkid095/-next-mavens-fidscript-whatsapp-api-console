import { callGatewayChecked } from '../../utils/gateway.js';
import { normalizePhone } from '../../utils/phone.js';
import type { Channel, ChannelMessage, ChannelIdentity } from '../index.js';

// =============================================================================
// WhatsApp channel — the gateway API v2.3.7 connector.
//
// The single source of truth for token-charging send paths is
// `services/whatsapp/messaging.ts` (called by /api/v1/messages/*). The Channel
// interface here is the shape every future channel (SMS, email, Instagram)
// must implement — this connector is the reference implementation.
//
//   - `parse()`: authoritative inbound parser; webhook receivers call it to
//     turn raw the gateway `messages.upsert` payloads into canonical ChannelMessages.
//   - `identity()`: looks up container connection state + phone number.
//   - `send()`: thin the gateway shim. For token-charging production sends, route
//     through the v1 endpoints instead (which add idempotency, token charges,
//     and DB persistence on top of the same callGatewayChecked primitive).
// =============================================================================

const EVOLUTION_PATHS: Record<ChannelMessage['type'], string | null> = {
  text: '/message/sendText/',
  image: '/message/sendImage/',
  video: '/message/sendVideo/',
  audio: '/message/sendWhatsAppAudio/',
  document: '/message/sendDocument/',
  sticker: '/message/sendMediaAsSticker/',
  location: '/message/sendLocation/',
  contact: '/message/sendContact/',
  reaction: '/message/sendReaction/',
  poll: '/message/sendPoll/',
  list: '/message/sendList/',
  button: '/message/sendButtons/',
  // status has a different shape (no `number`); handled separately below.
  status: null,
};

function isGroupJid(jid: string): boolean {
  return jid.includes('@g.us');
}

function extractPhoneFromJid(jid: string): string {
  const match = jid.match(/^(\d+)@/);
  return match ? (normalizePhone(match[1]) ?? jid) : jid;
}

/**
 * Authoritative inbound parser. Webhook receivers should call this — not the
 * legacy parseIncomingMessage — so all channels share the same canonical shape.
 */
export function parseWhatsAppMessage(raw: Record<string, unknown>): ChannelMessage | null {
  const key = raw.key as { remoteJid?: string; id?: string; fromMe?: boolean } | undefined;
  if (!key || key.fromMe) return null;
  const remoteJid = key.remoteJid || '';
  const inner = (raw.message ?? raw.msg) as Record<string, unknown> | undefined;
  const innerType = (inner?.type as string) || 'text';
  // Map the gateway `conversation` → text, `extendedTextMessage` → text, etc.
  const type: ChannelMessage['type'] = innerType.startsWith('conversation') || innerType === 'extendedTextMessage'
    ? 'text'
    : (innerType as ChannelMessage['type']);
  return {
    id: key.id || `msg_${Date.now()}`,
    from: extractPhoneFromJid(remoteJid),
    to: '',
    type,
    body: (raw.body as string) || (inner?.conversation as string) || '',
    mediaUrl: (raw.mediaUrl as string | null) ?? null,
    mediaMimetype: (raw.mimeType as string | null) ?? null,
    timestamp: (raw.timestamp as string) || new Date().toISOString(),
    isGroup: isGroupJid(remoteJid),
  };
}

export const whatsappChannel: Channel = {
  name: 'whatsapp',

  async send(instanceName: string, to: string, message: Omit<ChannelMessage, 'id' | 'timestamp' | 'from' | 'to'>): Promise<{ id: string }> {
    const evoName = encodeURIComponent(instanceName);
    // Status is a broadcast, not a recipient send.
    if (message.type === 'status') {
      const res = await callGatewayChecked('POST', `/message/sendStatus/${evoName}`, {
        type: 'text', content: message.body,
      });
      const key = (res.data as { key?: { id?: string } } | undefined)?.key;
      return { id: key?.id ?? `msg_${Date.now()}` };
    }
    const pathSuffix = EVOLUTION_PATHS[message.type];
    if (!pathSuffix) throw new Error(`Unsupported message type: ${message.type}`);
    const payload: Record<string, unknown> = { number: to, text: message.body };
    if (message.mediaUrl) {
      payload.mediaUrl = message.mediaUrl;
      if (message.mediaMimetype) payload.mimeType = message.mediaMimetype;
    }
    const res = await callGatewayChecked('POST', `${pathSuffix}${evoName}`, payload);
    if (!res.ok) throw new Error(`the gateway send failed: ${res.status}`);
    const key = (res.data as { key?: { id?: string } } | undefined)?.key;
    return { id: key?.id ?? `msg_${Date.now()}` };
  },

  parse: parseWhatsAppMessage,

  async identity(instanceName: string): Promise<ChannelIdentity | null> {
    try {
      const evoName = encodeURIComponent(instanceName);
      const res = await callGatewayChecked('GET', `/instance/connectionState/${evoName}`);
      const inst = (res.data as { instance?: { state?: string; phone?: string } } | undefined)?.instance;
      return {
        phoneNumber: inst?.phone ?? null,
        displayName: null,
        avatarUrl: null,
        isConnected: inst?.state === 'open',
      };
    } catch {
      return { phoneNumber: null, displayName: null, avatarUrl: null, isConnected: false };
    }
  },
};
