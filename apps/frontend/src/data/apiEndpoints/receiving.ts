import type { ApiEndpoint } from './index';

/**
 * Inbound webhook events. These are NOT request endpoints — they document the
 * events FIDScript delivers to a client's configured webhook URL. Cost is always
 * free; `method` is conceptually the delivered event.
 */
export const receivingEndpoints: ApiEndpoint[] = [
  {
    id: 'webhook.connectionUpdate', version: 'v1', method: 'POST',
    path: '<your-webhook-url>', name: 'connection.update', category: 'Receiving', cost: 0, rateLimit: 'read', auth: 'none',
    desc: 'Delivered when an instance connects, disconnects, or its phone number resolves. Set your webhook URL in instance settings.',
    pathParams: [],
    bodyFields: [
      { key: 'event', label: 'Event', type: 'string', default: 'connection.update' },
      { key: 'instance', label: 'Instance', type: 'string', desc: 'The instance name.' },
      { key: 'state', label: 'State', type: 'string', enum: ['connected', 'connecting', 'disconnected'] },
      { key: 'phoneNumber', label: 'Phone', type: 'string', desc: 'Resolved phone (E.164) once connected.' },
    ],
    response: { event: 'connection.update', instance: 'acme_main', state: 'connected', phoneNumber: '+254712345678' },
  },
  {
    id: 'webhook.messagesUpsert', version: 'v1', method: 'POST',
    path: '<your-webhook-url>', name: 'messages.upsert', category: 'Receiving', cost: 0, rateLimit: 'read', auth: 'none',
    desc: 'Delivered for every inbound message. `messageType` is normalized (text, image, video, document, audio, sticker, location, contact, reaction, poll, list_response, button_response).',
    pathParams: [],
    bodyFields: [
      { key: 'event', label: 'Event', type: 'string', default: 'messages.upsert' },
      { key: 'from', label: 'From', type: 'string', desc: 'Sender phone (E.164).' },
      { key: 'fromName', label: 'From name', type: 'string' },
      { key: 'messageType', label: 'Type', type: 'string' },
      { key: 'content', label: 'Content', type: 'text', desc: 'Display text (caption, vCard name, coordinates, etc.).' },
      { key: 'mediaUrl', label: 'Media URL', type: 'string', desc: 'Present for media types when media storage is configured.' },
      { key: 'extra', label: 'Extra', type: 'object', desc: 'Type-specific fields (e.g. {latitude, longitude} for location).' },
    ],
    response: { event: 'messages.upsert', from: '+254712345678', fromName: 'Jane', messageType: 'image', content: 'Look at this!', mediaUrl: 'https://…/img.jpg', extra: { caption: 'Look at this!' } },
  },
];
