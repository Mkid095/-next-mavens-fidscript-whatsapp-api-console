// Live WhatsApp-Web mirror — client-side API. Mirrors the backend normalizer's
// shapes in server/src/services/whatsapp/chatMirror.ts.

import { apiGet } from '../../data';

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

export const messagesApi = {
  getChats: (instanceName: string) =>
    apiGet<{ chats: ChatListItem[] }>(`/api/instance/chats/${encodeURIComponent(instanceName)}`),
  getThread: (instanceName: string, jid: string) =>
    apiGet<{ messages: MirrorMessage[] }>(
      `/api/instance/chats/${encodeURIComponent(instanceName)}/${encodeURIComponent(jid)}`
    ),
  getProfilePic: (instanceName: string, number: string) =>
    apiGet<{ url: string | null }>(
      `/api/instance/profile-pic/${encodeURIComponent(instanceName)}?number=${encodeURIComponent(number)}`
    ),
};

/** Turn a contact phone (e.g. "+254712345678") into a 1:1 WhatsApp JID. */
export function phoneToJid(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `${digits}@s.whatsapp.net` : '';
}
