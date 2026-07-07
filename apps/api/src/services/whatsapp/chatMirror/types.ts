/**
 * chatMirror types + utility helpers.
 */
import type { SendContext, SendResult } from '../shared.js';

export interface ChatListItem {
  jid: string;
  name: string;
  isGroup: boolean;
  lastMessage: string;
  lastMessageAt: number | null;
  unread: number;
  profilePic: string | null;
  aiMode: 'ai' | 'manual' | null;
  isRestricted: boolean;
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
  senderJid: string | null;
  timestamp: number;
}

export type { SendContext, SendResult };

// ---------------------------------------------------------------------------
// Low-level JSON extraction helpers
// ---------------------------------------------------------------------------

export type Rec = Record<string, unknown>;

export const str = (v: unknown): string => (typeof v === 'string' ? v : '');
export const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
export const rec = (v: unknown): Rec | null => (v && typeof v === 'object' ? (v as Rec) : null);

export function arrOf(data: unknown, keys: string[]): unknown[] {
  const root = rec(data);
  if (Array.isArray(data)) return data;
  if (!root) return [];
  for (const k of keys) {
    const v = root[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

export function toMs(v: unknown): number | null {
  const n = num(v);
  if (n === null) return null;
  return n < 1e12 ? n * 1000 : n;
}

export function readJid(item: Rec): string {
  const direct = str(item.remoteJid) || str(item.id);
  if (direct.includes('@')) return direct;
  const idObj = rec(item.id) || rec(item.key);
  if (idObj && (str(idObj.user) || str(idObj.remoteJid))) {
    return str(idObj.remoteJid) || `${str(idObj.user)}@${str(idObj.server) || 's.whatsapp.net'}`;
  }
  return direct;
}
