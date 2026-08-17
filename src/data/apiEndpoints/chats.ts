import type { ApiEndpoint } from './index';

const INSTANCE = { name: 'instance', desc: 'Your WhatsApp instance name', required: true };

/** Chat management - all FREE (no tokens). Reads V1_READ (600/min), mutations V1_MUTATE (120/min). */
export const chatEndpoints: ApiEndpoint[] = [
  { id: 'chats.markRead', version: 'v1', method: 'POST', path: '/api/v1/chats/mark-read/:instance', name: 'Mark Read', category: 'Chats', rateLimit: 'mutate',
    desc: 'Mark one or more messages as read.', pathParams: [INSTANCE],
    bodyFields: [{ key: 'readMessages', label: 'Messages', type: 'array', required: true, desc: 'Array of message key objects.', fields: [
      { key: 'key', label: 'Key', type: 'object', required: true, fields: [
        { key: 'remoteJid', label: 'Remote JID', type: 'string', required: true },
        { key: 'fromMe', label: 'From me', type: 'boolean', required: true },
        { key: 'id', label: 'Message ID', type: 'string', required: true },
      ] },
    ] }], evolutionPath: '/chat/markMessageAsRead/{instance}' },
  { id: 'chats.markUnread', version: 'v1', method: 'POST', path: '/api/v1/chats/mark-unread/:instance', name: 'Mark Unread', category: 'Chats', rateLimit: 'mutate',
    desc: 'Mark a chat as unread.', pathParams: [INSTANCE],
    bodyFields: [
      { key: 'chat', label: 'Chat JID', type: 'string', required: true },
      { key: 'lastMessage', label: 'Last message', type: 'array' },
    ], evolutionPath: '/chat/markChatUnread/{instance}' },
  { id: 'chats.archive', version: 'v1', method: 'POST', path: '/api/v1/chats/archive/:instance', name: 'Archive Chat', category: 'Chats', rateLimit: 'mutate',
    desc: 'Archive or unarchive a chat.', pathParams: [INSTANCE],
    bodyFields: [
      { key: 'chat', label: 'Chat JID', type: 'string', required: true },
      { key: 'archive', label: 'Archive', type: 'boolean', required: true, default: true },
      { key: 'lastMessage', label: 'Last message', type: 'object' },
    ], evolutionPath: '/chat/archiveChat/{instance}' },
  { id: 'chats.presence', version: 'v1', method: 'POST', path: '/api/v1/chats/presence/:instance', name: 'Send Presence', category: 'Chats', rateLimit: 'mutate',
    desc: 'Broadcast a presence update (typing, online, etc.).', pathParams: [INSTANCE],
    bodyFields: [
      { key: 'number', label: 'Number', type: 'string', required: true },
      { key: 'options', label: 'Options', type: 'object', desc: 'Presence options.' },
    ], evolutionPath: '/chat/sendPresence/{instance}' },
  { id: 'chats.deleteForEveryone', version: 'v1', method: 'DELETE', path: '/api/v1/chats/delete-for-everyone/:instance', name: 'Delete for Everyone', category: 'Chats', rateLimit: 'mutate',
    desc: 'Delete a message for everyone in the chat.', pathParams: [INSTANCE],
    bodyFields: [
      { key: 'id', label: 'Message ID', type: 'string', required: true },
      { key: 'remoteJid', label: 'Remote JID', type: 'string', required: true },
      { key: 'fromMe', label: 'From me', type: 'boolean', required: true },
      { key: 'participant', label: 'Participant', type: 'string' },
    ], evolutionPath: '/chat/deleteMessageForEveryone/{instance}' },
  { id: 'chats.updateMessage', version: 'v1', method: 'POST', path: '/api/v1/chats/update-message/:instance', name: 'Update Message', category: 'Chats', rateLimit: 'mutate',
    desc: 'Edit the text of a message you sent.', pathParams: [INSTANCE],
    bodyFields: [
      { key: 'number', label: 'Number', type: 'number', required: true },
      { key: 'text', label: 'New text', type: 'string', required: true },
      { key: 'key', label: 'Key', type: 'object', required: true, fields: [
        { key: 'remoteJid', label: 'Remote JID', type: 'string', required: true },
        { key: 'fromMe', label: 'From me', type: 'boolean', required: true },
        { key: 'id', label: 'Message ID', type: 'string', required: true },
      ] },
    ], evolutionPath: '/chat/updateMessage/{instance}' },
  { id: 'chats.findChats', version: 'v1', method: 'POST', path: '/api/v1/chats/find-chats/:instance', name: 'Find Chats', category: 'Chats', rateLimit: 'read',
    desc: 'List all open chats.', pathParams: [INSTANCE], bodyFields: [], evolutionPath: '/chat/findChats/{instance}' },
  { id: 'chats.findContacts', version: 'v1', method: 'POST', path: '/api/v1/chats/find-contacts/:instance', name: 'Find Contacts', category: 'Chats', rateLimit: 'read',
    desc: 'Search contacts with optional filter.', pathParams: [INSTANCE],
    bodyFields: [{ key: 'where', label: 'Filter', type: 'object', desc: 'Mongo-style filter, e.g. { displayName: /Ken/ }.' }], evolutionPath: '/chat/findContacts/{instance}' },
  { id: 'chats.findMessages', version: 'v1', method: 'POST', path: '/api/v1/chats/find-messages/:instance', name: 'Find Messages', category: 'Chats', rateLimit: 'read',
    desc: 'Search messages with optional filter.', pathParams: [INSTANCE],
    bodyFields: [{ key: 'where', label: 'Filter', type: 'object', desc: 'Mongo-style filter.' }], evolutionPath: '/chat/findMessages/{instance}' },
  { id: 'chats.findStatus', version: 'v1', method: 'POST', path: '/api/v1/chats/find-status/:instance', name: 'Find Status', category: 'Chats', rateLimit: 'read',
    desc: 'Search status updates.', pathParams: [INSTANCE],
    bodyFields: [
      { key: 'where', label: 'Filter', type: 'object' },
      { key: 'limit', label: 'Limit', type: 'number', default: 10 },
    ], evolutionPath: '/chat/findStatusMessage/{instance}' },
  { id: 'chats.isWhatsApp', version: 'v1', method: 'POST', path: '/api/v1/chats/is-whatsapp/:instance', name: 'Is WhatsApp', category: 'Chats', rateLimit: 'read',
    desc: 'Check which numbers are registered on WhatsApp.', pathParams: [INSTANCE],
    bodyFields: [{ key: 'numbers', label: 'Numbers', type: 'array', required: true, desc: 'Phone numbers to check.' }], evolutionPath: '/chat/whatsappNumbers/{instance}' },
  { id: 'chats.getBase64', version: 'v1', method: 'POST', path: '/api/v1/chats/base64/:instance', name: 'Get Base64', category: 'Chats', rateLimit: 'read',
    desc: 'Retrieve media as base64 (for re-uploading or forwarding).', pathParams: [INSTANCE],
    bodyFields: [
      { key: 'message', label: 'Message', type: 'object', required: true, desc: 'The full message object.' },
      { key: 'convertToMp4', label: 'Convert to MP4', type: 'boolean', default: false },
    ], evolutionPath: '/chat/getBase64FromMediaMessage/{instance}' },
  { id: 'chats.profilePicUrl', version: 'v1', method: 'GET', path: '/api/v1/chats/profile-pic-url/:instance', name: 'Profile Pic URL', category: 'Chats', rateLimit: 'read',
    desc: 'Get the profile picture URL for a number.', pathParams: [INSTANCE],
    bodyFields: [{ key: 'number', label: 'Number', type: 'string', required: true, placeholder: '254712345678' }], evolutionPath: '/chat/fetchProfilePictureUrl/{instance}' },
];
