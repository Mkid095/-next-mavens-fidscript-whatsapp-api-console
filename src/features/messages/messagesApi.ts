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
  /** AI mode for this chat — 'ai' = AI active, 'manual' = agent override, null = no override */
  aiMode: 'ai' | 'manual' | null;
  /** true = only admins can send in this group */
  isRestricted: boolean;
  /** true = our instance is an admin in this group */
  isAdmin: boolean;
}

export interface MirrorMessage {
  id: string;
  direction: 'incoming' | 'outgoing';
  type: string;
  content: string;
  mediaUrl: string | null;
  mediaMimetype: string | null;
  senderName: string | null;
  /** Full JID of the sender — used for group avatar lookup */
  senderJid: string | null;
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
  /** Mark all incoming unread messages in a chat as read. Clears the badge. */
  markRead: (instanceName: string, jid: string) =>
    apiPost<{ updated: number }>(`/api/platform/chats/${encodeURIComponent(instanceName)}/mark-read`, { jid }),

  /** Check AI override mode for a WhatsApp chat (by JID). Returns full override details. */
  getAiOverride: (chatId: string) =>
    apiGet<{ mode: 'ai' | 'manual' | null; hasChatbot?: boolean; expiresAt: string | null; resumePolicy: string | null; reason: string | null; overriddenBy: string | null; overriddenAt: string | null }>(
      `/api/platform/conversations/override/${encodeURIComponent(chatId)}`
    ),

  /** Take over a WhatsApp chat (by JID) — disables AI, enables manual agent mode.
   * @param opts.expiresAt    ISO timestamp — if set, AI auto-resumes at this time
   * @param opts.resumePolicy  'manual' | 'next_message' | 'timeout'
   * @param opts.reason       handoff reason code
   * @param opts.note         free-text note
   */
  takeOver: (chatId: string, opts?: { expiresAt?: string; resumePolicy?: string; reason?: string; note?: string }) =>
    apiPost<{ success: boolean; message?: string }>(
      `/api/platform/conversations/takeover/${encodeURIComponent(chatId)}`,
      opts
    ),

  /** Resume AI for a WhatsApp chat (by JID) — removes the manual override. */
  resumeAi: (chatId: string) =>
    apiPost<{ success: boolean; message?: string }>(
      `/api/platform/conversations/resume-ai/${encodeURIComponent(chatId)}`
    ),

  /** WhatsApp contact search via Evolution API (finds contacts in the WA phonebook). */
  findContacts: (instanceName: string, query?: string) =>
    apiPost<{ contacts: { jid: string; name?: string; pushName?: string; phone?: string }[] }>(
      `/api/platform/chats/${encodeURIComponent(instanceName)}/contacts`,
      query ? { query } : {}
    ),
};

/** Turn a contact phone (e.g. "+254712345678") into a 1:1 WhatsApp JID. */
export function phoneToJid(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `${digits}@s.whatsapp.net` : '';
}