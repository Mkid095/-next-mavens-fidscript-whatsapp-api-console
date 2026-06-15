import type { ApiEndpoint } from './index';

const INSTANCE_PARAM = { name: 'instance', desc: 'Your WhatsApp instance name', required: true };

const RESPONSE_BASE = { messageId: 'msg_3f8a1c2b9d4e', to: '254712345678', timestamp: '2026-06-15T09:30:00.000Z' };

/** Send endpoints — each deducts tokens (see tokenCosts). */
export const messagingEndpoints: ApiEndpoint[] = [
  {
    id: 'messages.sendText', version: 'v1', method: 'POST',
    path: '/api/v1/messages/text/:instance', name: 'Send Text', category: 'Messaging', cost: 1, rateLimit: 'send',
    desc: 'Send a plain-text WhatsApp message.',
    pathParams: [INSTANCE_PARAM],
    bodyFields: [
      { key: 'to', label: 'Recipient', type: 'string', required: true, placeholder: '254712345678', desc: 'Phone number in international format, no +.' },
      { key: 'message', label: 'Message', type: 'text', required: true, placeholder: 'Hello from FIDScript!' },
    ],
    response: { success: true, data: { ...RESPONSE_BASE, message: 'Hello from FIDScript!' } },
    evolutionPath: '/message/sendText/{instance}',
  },
  {
    id: 'messages.sendMedia', version: 'v1', method: 'POST',
    path: '/api/v1/messages/media/:instance', name: 'Send Media', category: 'Messaging', cost: 2, rateLimit: 'send',
    desc: 'Send an image, video, document or audio file by URL.',
    pathParams: [INSTANCE_PARAM],
    bodyFields: [
      { key: 'to', label: 'Recipient', type: 'string', required: true, placeholder: '254712345678' },
      { key: 'media_url', label: 'Media URL', type: 'string', required: true, placeholder: 'https://…/photo.jpg', desc: 'Public HTTPS URL of the media.' },
      { key: 'media_type', label: 'Media type', type: 'string', enum: ['image', 'video', 'document', 'audio'], default: 'image' },
      { key: 'caption', label: 'Caption', type: 'string', placeholder: 'Look at this!' },
    ],
    response: { success: true, data: { ...RESPONSE_BASE, media_url: 'https://…/photo.jpg', media_type: 'image' } },
    evolutionPath: '/message/sendMedia/{instance}',
  },
  {
    id: 'messages.sendLocation', version: 'v1', method: 'POST',
    path: '/api/v1/messages/location/:instance', name: 'Send Location', category: 'Messaging', cost: 1, rateLimit: 'send',
    desc: 'Share a geographic location pin.',
    pathParams: [INSTANCE_PARAM],
    bodyFields: [
      { key: 'to', label: 'Recipient', type: 'string', required: true, placeholder: '254712345678' },
      { key: 'latitude', label: 'Latitude', type: 'number', required: true, placeholder: '-1.2921' },
      { key: 'longitude', label: 'Longitude', type: 'number', required: true, placeholder: '36.8219' },
      { key: 'name', label: 'Name', type: 'string', placeholder: 'Nairobi CBD' },
      { key: 'address', label: 'Address', type: 'string', placeholder: 'Kenya' },
    ],
    response: { success: true, data: { ...RESPONSE_BASE, location: { latitude: -1.2921, longitude: 36.8219, name: 'Nairobi CBD' } } },
    evolutionPath: '/message/sendLocation/{instance}',
  },
  {
    id: 'messages.sendContact', version: 'v1', method: 'POST',
    path: '/api/v1/messages/contact/:instance', name: 'Send Contact', category: 'Messaging', cost: 1, rateLimit: 'send',
    desc: 'Share one or more contact cards.',
    pathParams: [INSTANCE_PARAM],
    bodyFields: [
      { key: 'to', label: 'Recipient', type: 'string', required: true, placeholder: '254712345678' },
      { key: 'contact', label: 'Contacts', type: 'array', required: true, desc: 'Array of contact cards.', fields: [
        { key: 'fullName', label: 'Full name', type: 'string', required: true },
        { key: 'wuid', label: 'WhatsApp ID', type: 'string', placeholder: '254712345678' },
        { key: 'phoneNumber', label: 'Phone', type: 'string', required: true },
        { key: 'organization', label: 'Organization', type: 'string' },
      ] },
    ],
    response: { success: true, data: { ...RESPONSE_BASE, contact: { fullName: 'Jane Doe', phoneNumber: '254712345678' } } },
    evolutionPath: '/message/sendContact/{instance}',
  },
  {
    id: 'messages.sendReaction', version: 'v1', method: 'POST',
    path: '/api/v1/messages/reaction/:instance', name: 'Send Reaction', category: 'Messaging', cost: 1, rateLimit: 'send',
    desc: 'React to an existing message (emoji).',
    pathParams: [INSTANCE_PARAM],
    bodyFields: [
      { key: 'to', label: 'Recipient', type: 'string', required: true, placeholder: '254712345678' },
      { key: 'key', label: 'Message key', type: 'object', required: true, desc: 'The key of the message to react to.', fields: [
        { key: 'remoteJid', label: 'Remote JID', type: 'string', required: true },
        { key: 'fromMe', label: 'From me', type: 'boolean', default: false },
        { key: 'id', label: 'Message ID', type: 'string', required: true },
      ] },
      { key: 'reaction', label: 'Reaction', type: 'string', required: true, placeholder: '👍', desc: 'A single emoji, or empty to remove.' },
    ],
    response: { success: true, data: { ...RESPONSE_BASE, reaction: '👍' } },
    evolutionPath: '/message/sendReaction/{instance}',
  },
  {
    id: 'messages.sendPoll', version: 'v1', method: 'POST',
    path: '/api/v1/messages/poll/:instance', name: 'Send Poll', category: 'Messaging', cost: 1, rateLimit: 'send',
    desc: 'Send an interactive poll.',
    pathParams: [INSTANCE_PARAM],
    bodyFields: [
      { key: 'to', label: 'Recipient', type: 'string', required: true, placeholder: '254712345678' },
      { key: 'name', label: 'Question', type: 'string', required: true, placeholder: 'Where shall we meet?' },
      { key: 'selectableCount', label: 'Selectable count', type: 'number', required: true, default: 1, desc: 'How many options a voter may pick.' },
      { key: 'values', label: 'Options', type: 'array', required: true, desc: 'At least 2 option strings.' },
    ],
    response: { success: true, data: { ...RESPONSE_BASE, poll: { name: 'Where shall we meet?', selectableCount: 1, values: ['Cafe', 'Office'] } } },
    evolutionPath: '/message/sendPoll/{instance}',
  },
  {
    id: 'messages.sendList', version: 'v1', method: 'POST',
    path: '/api/v1/messages/list/:instance', name: 'Send List', category: 'Messaging', cost: 1, rateLimit: 'send',
    desc: 'Send an interactive list message with selectable sections.',
    pathParams: [INSTANCE_PARAM],
    bodyFields: [
      { key: 'to', label: 'Recipient', type: 'string', required: true, placeholder: '254712345678' },
      { key: 'title', label: 'Title', type: 'string', required: true },
      { key: 'description', label: 'Description', type: 'string' },
      { key: 'buttonText', label: 'Button text', type: 'string', required: true, default: 'Options' },
      { key: 'footerText', label: 'Footer', type: 'string' },
      { key: 'sections', label: 'Sections', type: 'array', required: true, fields: [
        { key: 'title', label: 'Section title', type: 'string', required: true },
        { key: 'rows', label: 'Rows', type: 'array', required: true, fields: [
          { key: 'title', label: 'Row title', type: 'string', required: true },
          { key: 'description', label: 'Row description', type: 'string' },
          { key: 'rowId', label: 'Row ID', type: 'string', required: true },
        ] },
      ] },
    ],
    response: { success: true, data: { ...RESPONSE_BASE, list: { title: 'Menu', buttonText: 'Options' } } },
    evolutionPath: '/message/sendList/{instance}',
  },
];
