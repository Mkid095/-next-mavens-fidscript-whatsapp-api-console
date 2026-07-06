import type { ApiEndpoint } from './index';

const INSTANCE = { name: 'instance', desc: 'Your WhatsApp instance name', required: true };

/** Instance lifecycle — all FREE (no tokens). Reads V1_MUTATE, restart/logout V1_STRICT. */
export const instanceEndpoints: ApiEndpoint[] = [
  { id: 'instance.connectionState', version: 'v1', method: 'GET', path: '/api/v1/instance/connection-state/:instance', name: 'Connection State', category: 'Instance', rateLimit: 'mutate',
    desc: 'Get the current connection state and phone number.', pathParams: [INSTANCE], bodyFields: [], evolutionPath: '/instance/connectionState/{instance}' },
  { id: 'instance.connect', version: 'v1', method: 'GET', path: '/api/v1/instance/connect/:instance', name: 'Connect / QR', category: 'Instance', rateLimit: 'mutate',
    desc: 'Generate a new QR code and start the WhatsApp session. Use /instance/connection-state to poll until connected.',
    pathParams: [INSTANCE],
    bodyFields: [{ key: 'number', label: 'Number', type: 'string', desc: 'Specific phone number to use (optional).' }], evolutionPath: '/instance/connect/{instance}' },
  { id: 'instance.restart', version: 'v1', method: 'POST', path: '/api/v1/instance/restart/:instance', name: 'Restart', category: 'Instance', rateLimit: 'strict',
    desc: 'Restart the WhatsApp session. Requires {"confirm":true} in the body or X-Confirm-Restart: true header — 428 otherwise.',
    pathParams: [INSTANCE],
    bodyFields: [{ key: 'confirm', label: 'Confirm', type: 'boolean', required: true, default: true, desc: 'Must be true to proceed.' }], evolutionPath: '/instance/restart/{instance}' },
  { id: 'instance.logout', version: 'v1', method: 'DELETE', path: '/api/v1/instance/logout/:instance', name: 'Logout', category: 'Instance', rateLimit: 'strict',
    desc: 'Disconnect and log out of the WhatsApp session.', pathParams: [INSTANCE], bodyFields: [], evolutionPath: '/instance/logout/{instance}' },
  { id: 'instance.setPresence', version: 'v1', method: 'POST', path: '/api/v1/instance/set-presence/:instance', name: 'Set Presence', category: 'Instance', rateLimit: 'mutate',
    desc: 'Broadcast your presence (available or unavailable).',
    pathParams: [INSTANCE],
    bodyFields: [{ key: 'presence', label: 'Presence', type: 'string', required: true, enum: ['available', 'unavailable'] }], evolutionPath: '/instance/setPresence/{instance}' },
  { id: 'instance.qr', version: 'v1', method: 'GET', path: '/api/v1/instance/qr/:instance', name: 'Fetch QR', category: 'Instance', rateLimit: 'mutate',
    desc: 'Fetch the current QR code without triggering a new connection. Returns 204 if no QR is pending.',
    pathParams: [INSTANCE], bodyFields: [], evolutionPath: '/instance/connect/{instance}' },
];
