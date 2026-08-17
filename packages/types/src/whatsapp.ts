/**
 * whatsapp.ts - WhatsApp messaging types shared across SDK, CLI, and frontend.
 * Covers all 10 send types plus the supporting data shapes.
 */

// ── Send request types (10 message types) ─────────────────────────────────────

export interface SendText {
  number: string;
  message: string;
}

export interface SendMedia {
  number: string;
  media_url: string;
  media_type: 'image' | 'video' | 'document' | 'audio';
  caption?: string;
}

export interface SendLocation {
  number: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface SendContact {
  number: string;
  contact: ContactCard[];
}

export interface SendReaction {
  number: string;
  key: MessageKey;
  reaction: string;
}

export interface SendPoll {
  number: string;
  name: string;
  selectableCount: number;
  values: string[];
}

export interface SendList {
  number: string;
  title: string;
  buttonText: string;
  description?: string;
  footerText?: string;
  sections: ListSection[];
}

export interface SendAudio {
  number: string;
  audio: string;
}

export interface SendSticker {
  number: string;
  sticker: string;
}

export interface SendStatus {
  type: 'text' | 'image' | 'audio';
  content: string;
  caption?: string;
  backgroundColor?: string;
  font?: 1 | 2 | 3 | 4;
  allContacts?: boolean;
  statusJidList?: string[];
}

// ── Supporting shapes ─────────────────────────────────────────────────────────

export interface ContactCard {
  fullName: string;
  wuid?: string;
  phoneNumber: string;
  organization?: string;
}

export interface MessageKey {
  remoteJid: string;
  fromMe?: boolean;
  id: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface ListRow {
  title: string;
  description?: string;
  rowId: string;
}

// ── Send result ───────────────────────────────────────────────────────────────

export interface SendResult {
  key?: { id?: string };
  message?: string;
  timestamp?: string;
}
