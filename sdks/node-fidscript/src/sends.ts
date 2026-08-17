/**
 * sends.ts - typed wrappers for all 10 WhatsApp message types.
 * POST /api/v1/messages/<type>/:instance
 */
import type { FidscriptClient } from './client.js';
import type {
  SendText, SendMedia, SendLocation, SendContact, SendReaction, SendPoll,
  SendList, SendAudio, SendSticker, SendStatus, SendResult,
} from './types.js';

export class SendsResource {
  constructor(private readonly client: FidscriptClient) {}

  text(instance: string, body: SendText): Promise<SendResult> {
    return this.client.request<SendResult>('POST', `/api/v1/messages/text/${encodeURIComponent(instance)}`, body, { auth: 'apikey' });
  }
  media(instance: string, body: SendMedia): Promise<SendResult> {
    return this.client.request<SendResult>('POST', `/api/v1/messages/media/${encodeURIComponent(instance)}`, body, { auth: 'apikey' });
  }
  location(instance: string, body: SendLocation): Promise<SendResult> {
    return this.client.request<SendResult>('POST', `/api/v1/messages/location/${encodeURIComponent(instance)}`, body, { auth: 'apikey' });
  }
  contact(instance: string, body: SendContact): Promise<SendResult> {
    return this.client.request<SendResult>('POST', `/api/v1/messages/contact/${encodeURIComponent(instance)}`, body, { auth: 'apikey' });
  }
  reaction(instance: string, body: SendReaction): Promise<SendResult> {
    return this.client.request<SendResult>('POST', `/api/v1/messages/reaction/${encodeURIComponent(instance)}`, body, { auth: 'apikey' });
  }
  poll(instance: string, body: SendPoll): Promise<SendResult> {
    return this.client.request<SendResult>('POST', `/api/v1/messages/poll/${encodeURIComponent(instance)}`, body, { auth: 'apikey' });
  }
  list(instance: string, body: SendList): Promise<SendResult> {
    return this.client.request<SendResult>('POST', `/api/v1/messages/list/${encodeURIComponent(instance)}`, body, { auth: 'apikey' });
  }
  audio(instance: string, body: SendAudio): Promise<SendResult> {
    return this.client.request<SendResult>('POST', `/api/v1/messages/audio/${encodeURIComponent(instance)}`, body, { auth: 'apikey' });
  }
  sticker(instance: string, body: SendSticker): Promise<SendResult> {
    return this.client.request<SendResult>('POST', `/api/v1/messages/sticker/${encodeURIComponent(instance)}`, body, { auth: 'apikey' });
  }
  status(instance: string, body: SendStatus): Promise<SendResult> {
    return this.client.request<SendResult>('POST', `/api/v1/messages/status/${encodeURIComponent(instance)}`, body, { auth: 'apikey' });
  }
}