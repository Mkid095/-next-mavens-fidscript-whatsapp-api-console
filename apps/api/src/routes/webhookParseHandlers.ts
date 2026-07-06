/**
 * Webhook parse handlers — message parsing, phone extraction, LID learning,
 * contact-name resolution, and self-message filtering.
 */
import { Request } from 'express';
import { parseIncomingMessage } from '../utils/messageParser.js';
import { normalizePhone } from '../utils/phone.js';
import { learnLid } from '../services/whatsapp/lidResolver/index.js';
import { getGroupParticipantName } from '../services/whatsapp/groupSync.js';

export function extractPhoneFromJid(sender: string): string | null {
  if (!sender) return null;
  const match = sender.match(/^(\d+)@/);
  if (match) {
    const phone = match[1];
    return phone.startsWith('0') ? `+${phone}` : `+${phone}`;
  }
  return null;
}

export interface ParsedMessageContext {
  remoteJid: string;
  remoteJidAlt: string | null;
  isGroup: boolean;
  phone: string | null;
  chatId: string;
  msgId: string;
  pushName: string | undefined;
  resolvedSenderName: string | undefined;
  parsed: {
    messageType: string;
    content: string;
    mediaUrl: string | null;
    extra: Record<string, unknown>;
  };
  senderJid: string;
}

/**
 * Parse an incoming messages.upsert payload.
 * Returns null if the message should be skipped (e.g. self-message).
 */
export function parseIncomingWebhookMessage(
  data: Record<string, unknown>,
  sender: string | undefined,
  instancePhone: string | null,
): ParsedMessageContext | null {
  const key = data?.key as { remoteJid?: string; remoteJidAlt?: string; fromMe?: boolean; id?: string } | undefined;
  if (!key || key.fromMe) return null;

  const senderJid = (sender as string | undefined) || key.remoteJid;
  const remoteJid = key.remoteJid || '';
  const remoteJidAlt = key.remoteJidAlt || null;
  const isGroup = remoteJid.includes('@g.us');

  const instancePhoneNorm = instancePhone ? normalizePhone(instancePhone) : null;
  const remotePhone = remoteJid ? normalizePhone(extractPhoneFromJid(remoteJid) || remoteJid) : null;

  // Skip self-messages
  if (!isGroup && instancePhoneNorm && remotePhone && instancePhoneNorm === remotePhone) {
    return null;
  }

  const rawPhone = remoteJid ? extractPhoneFromJid(remoteJid) : null;
  const phone = rawPhone ? normalizePhone(rawPhone) : null;

  let chatId: string;
  if (isGroup) {
    chatId = remoteJid || '';
  } else if (phone) {
    chatId = phone;
  } else if (remoteJidAlt && remoteJidAlt.includes('@s.whatsapp.net')) {
    chatId = remoteJidAlt;
  } else {
    chatId = remoteJid;
  }

  const msgId = (data?.key as { id?: string })?.id || `msg_${Date.now()}`;
  const pushName = data?.pushName as string | undefined;

  // Learn LID -> phone mapping for outbound routing
  if (!isGroup && remoteJid.endsWith('@lid') && phone) {
    learnLid('', remoteJid, remoteJidAlt || `${phone}@s.whatsapp.net`);
  }

  // Resolve sender name for group messages from cached contacts
  let resolvedSenderName: string | undefined = pushName;
  if (isGroup && phone) {
    const cachedName = getGroupParticipantName(remoteJid, phone);
    if (cachedName) resolvedSenderName = cachedName;
  }

  const parsed = parseIncomingMessage(data ?? {});

  return {
    remoteJid,
    remoteJidAlt,
    isGroup,
    phone,
    chatId,
    msgId,
    pushName,
    resolvedSenderName,
    parsed,
    senderJid: senderJid || '',
  };
}
