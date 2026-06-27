// Live WhatsApp-Web mirror + outbound usage + phonebook sync — client-side
// API. Mirrors the backend shapes in server/src/services/whatsapp/chatMirror.ts
// and outboundUsage.ts. All routes are mounted under the platform router so
// they use the 600/min platformLimiter backstop + per-route 10/sec caps.

import { apiGet, apiPost } from '../../data';

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

export interface OutboundUsage {
  uniqueInitiationsToday: number;
  tier: 0 | 1 | 2 | 3 | 4;
  tierLimit: number;
  upgradeThreshold: number;
  windowStart: string;
  resetsAt: string;
  remaining: number;
  pct: number;
  canSend: boolean;
}

export interface BatchCheck {
  batchSize: number;
  wouldBeNewInitiations: number;
  uniqueAfter: number;
  tierLimit: number;
  tier: 0 | 1 | 2 | 3 | 4;
  wouldExceed: boolean;
  safeToSend: number;
}

export const messagesApi = {
  getChats: (instanceName: string) =>
    apiGet<{ chats: ChatListItem[] }>(`/api/platform/chats/${encodeURIComponent(instanceName)}`),
  getThread: (instanceName: string, jid: string) =>
    apiGet<{ messages: MirrorMessage[] }>(
      `/api/platform/chats/${encodeURIComponent(instanceName)}/${encodeURIComponent(jid)}`
    ),
  getProfilePic: (instanceName: string, number: string) =>
    apiGet<{ url: string | null }>(
      `/api/platform/profile-pic/${encodeURIComponent(instanceName)}?number=${encodeURIComponent(number)}`
    ),
  getOutboundUsage: (instanceName: string) =>
    apiGet<OutboundUsage>(`/api/platform/usage/outbound/${encodeURIComponent(instanceName)}`),
  checkOutboundBatch: (instanceName: string, chatIds: string[]) =>
    apiPost<BatchCheck>(`/api/platform/usage/check-batch/${encodeURIComponent(instanceName)}`, { chatIds }),
  syncPhonebook: (instanceName: string) =>
    apiPost<{ synced: number; removed: number; error?: string }>(
      `/api/platform/phonebook/sync/${encodeURIComponent(instanceName)}`
    ),
};

/** Turn a contact phone (e.g. "+254712345678") into a 1:1 WhatsApp JID. */
export function phoneToJid(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `${digits}@s.whatsapp.net` : '';
}