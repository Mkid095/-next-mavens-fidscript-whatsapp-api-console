// Re-export API types from services (avoid redefining Instance, Client, etc.)
export type { TokenPackage, DailyUsage } from '../../services/types';

// Re-export ClientApiKey and ClientMessage (as InboxMessage) from contacts service
export type { ClientApiKey, ClientMessage as InboxMessage } from '../../services/contacts';

// UI-specific types only below

export interface Contact {
  id: string;
  phone: string;
  name: string;
  created_at: string;
  tags?: string[];
}

export interface QueuedMessage {
  id: string;
  phone: string;
  name?: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  sent_at?: string;
  created_at: string;
  instance?: string;
  source: 'platform' | 'api';
}

export const TOKEN_COSTS = {
  send_text: 1,
  send_image: 2,
  send_document: 3,
  send_audio: 4,
  send_video: 3,
  bulk_campaign: 1,
  otp: 1,
  contact_import: 1,
} as const;

export const RATE_LIMIT_PER_SEC = 2;