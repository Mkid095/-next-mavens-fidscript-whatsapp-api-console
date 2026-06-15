import { callEvolutionAPI } from '../../utils/evolution.js';
import { normalizePhone } from '../../utils/phone.js';
import type { Channel, ChannelMessage, ChannelIdentity } from '../index.js';

// =============================================================================
// WhatsApp channel — Evolution API v2.3.7 connector shim.
// Implements the Channel interface over the existing Evolution proxy.
// =============================================================================

function evolutionName(instanceName: string): string {
  return instanceName;
}

function isGroupJid(jid: string): boolean {
  return jid.includes('@g.us');
}

function extractPhoneFromJid(jid: string): string {
  const match = jid.match(/^(\d+)@/);
  return match ? (normalizePhone(match[1]) ?? jid) : jid;
}

export const whatsappChannel: Channel = {
  name: 'whatsapp',

  async send(instanceName: string, to: string, message: Omit<ChannelMessage, 'id' | 'timestamp' | 'from' | 'to'>): Promise<{ id: string }> {
    const evoName = evolutionName(instanceName);
    const payload: Record<string, unknown> = {
      number: to,
      text: message.body,
    };

    if (message.mediaUrl) {
      payload.mediaUrl = message.mediaUrl;
      if (message.mediaMimetype) {
        payload.mimeType = message.mediaMimetype;
      }
    }

    const type = message.type;
    let path = `/message/sendText/${evoName}`;
    if (type === 'image') path = `/message/sendImage/${evoName}`;
    else if (type === 'video') path = `/message/sendVideo/${evoName}`;
    else if (type === 'audio') path = `/message/sendWhatsAppAudio/${evoName}`;
    else if (type === 'document') path = `/message/sendDocument/${evoName}`;
    else if (type === 'sticker') path = `/message/sendMediaAsSticker/${evoName}`;
    else if (type === 'location') path = `/message/sendLocation/${evoName}`;
    else if (type === 'contact') path = `/message/sendContact/${evoName}`;
    else if (type === 'reaction') path = `/message/sendReaction/${evoName}`;
    else if (type === 'poll') path = `/message/sendPoll/${evoName}`;
    else if (type === 'list') path = `/message/sendList/${evoName}`;
    else if (type === 'button') path = `/message/sendButtons/${evoName}`;

    const result = await callEvolutionAPI('POST', path, payload) as { key?: { id?: string } };
    return { id: result?.key?.id ?? `msg_${Date.now()}` };
  },

  parse(raw: Record<string, unknown>): ChannelMessage | null {
    const key = raw.key as { remoteJid?: string; id?: string; fromMe?: boolean } | undefined;
    if (!key || key.fromMe) return null;

    const remoteJid = key.remoteJid || '';
    const msg: ChannelMessage = {
      id: key.id || `msg_${Date.now()}`,
      from: extractPhoneFromJid(remoteJid),
      to: '',
      type: (((raw.msg as Record<string, unknown>)?.type as string) || 'text') as ChannelMessage['type'],
      body: raw.text as string || raw.body as string || '',
      mediaUrl: raw.mediaUrl as string | null ?? null,
      mediaMimetype: raw.mimeType as string | null ?? null,
      timestamp: raw.timestamp as string || new Date().toISOString(),
      isGroup: isGroupJid(remoteJid),
    };
    return msg;
  },

  async identity(instanceName: string): Promise<ChannelIdentity | null> {
    try {
      const evoName = evolutionName(instanceName);
      const result = await callEvolutionAPI('GET', `/instance/connectionState/${evoName}`) as {
        instance?: { state?: string; phone?: string };
      };
      const inst = result?.instance;
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
