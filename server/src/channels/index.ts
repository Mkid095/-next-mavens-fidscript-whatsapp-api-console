// =============================================================================
// Channel interface — the seam for adding new channels.
// WhatsApp (Evolution) is the first channel; SMS/email/Instagram plug in later.
// Adding a channel = a folder under channels/ implementing this interface.
// =============================================================================

export { whatsappChannel, parseWhatsAppMessage } from './whatsapp/index.js';

export interface ChannelMessage {
  id: string;
  from: string;       // canonical identifier
  to: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact' | 'reaction' | 'poll' | 'list' | 'button' | 'status';
  body: string;
  mediaUrl?: string | null;
  mediaMimetype?: string | null;
  timestamp: string;
  isGroup: boolean;
}

export interface ChannelIdentity {
  phoneNumber: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isConnected: boolean;
}

export interface Channel {
  /** Human-readable name */
  name: string;
  /** Send a message through this channel */
  send(instanceName: string, to: string, message: Omit<ChannelMessage, 'id' | 'timestamp'>): Promise<{ id: string }>;
  /** Parse an inbound webhook payload into a ChannelMessage */
  parse(raw: Record<string, unknown>): ChannelMessage | null;
  /** Get the identity (phone, name, avatar) for a connected instance */
  identity(instanceName: string): Promise<ChannelIdentity | null>;
}
