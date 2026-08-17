import type { ApiEndpoint } from './index';

const INSTANCE = { name: 'instance', desc: 'Your WhatsApp instance name', required: true };

/** Profile & privacy - all FREE (no tokens). Reads V1_READ (600/min), updates V1_STRICT (30/min). */
export const profileEndpoints: ApiEndpoint[] = [
  { id: 'profile.fetch', version: 'v1', method: 'POST', path: '/api/v1/profile/fetch/:instance', name: 'Fetch Profile', category: 'Profile', rateLimit: 'read',
    desc: 'Fetch a contact\'s full profile by phone number.', pathParams: [INSTANCE],
    bodyFields: [{ key: 'number', label: 'Number', type: 'string', required: true, placeholder: '254712345678' }], evolutionPath: '/chat/fetchProfile/{instance}' },
  { id: 'profile.fetchPrivacy', version: 'v1', method: 'GET', path: '/api/v1/profile/fetch-privacy/:instance', name: 'Fetch Privacy', category: 'Profile', rateLimit: 'read',
    desc: 'Fetch the instance owner\'s privacy settings.', pathParams: [INSTANCE], bodyFields: [], evolutionPath: '/chat/fetchPrivacySettings/{instance}' },
  { id: 'profile.updateName', version: 'v1', method: 'POST', path: '/api/v1/profile/update-name/:instance', name: 'Update Name', category: 'Profile', rateLimit: 'strict',
    desc: 'Update the display name shown to contacts.', pathParams: [INSTANCE],
    bodyFields: [{ key: 'name', label: 'Name', type: 'string', required: true, placeholder: 'Ken' }], evolutionPath: '/chat/updateProfileName/{instance}' },
  { id: 'profile.updateStatus', version: 'v1', method: 'POST', path: '/api/v1/profile/update-status/:instance', name: 'Update Status', category: 'Profile', rateLimit: 'strict',
    desc: 'Update your WhatsApp status (bio text).', pathParams: [INSTANCE],
    bodyFields: [{ key: 'status', label: 'Status', type: 'string', required: true, placeholder: 'Available' }], evolutionPath: '/chat/updateProfileStatus/{instance}' },
  { id: 'profile.updatePicture', version: 'v1', method: 'POST', path: '/api/v1/profile/update-picture/:instance', name: 'Update Picture', category: 'Profile', rateLimit: 'strict',
    desc: 'Set your profile picture from an image URL.', pathParams: [INSTANCE],
    bodyFields: [{ key: 'picture', label: 'Image URL', type: 'string', required: true, placeholder: 'https://…/photo.jpg' }], evolutionPath: '/chat/updateProfilePicture/{instance}' },
  { id: 'profile.removePicture', version: 'v1', method: 'DELETE', path: '/api/v1/profile/remove-picture/:instance', name: 'Remove Picture', category: 'Profile', rateLimit: 'strict',
    desc: 'Remove your profile picture.', pathParams: [INSTANCE], bodyFields: [], evolutionPath: '/chat/removeProfilePicture/{instance}' },
];

/** Instance settings - all FREE (no tokens). Reads V1_READ, updates V1_STRICT. */
export const settingsEndpoints: ApiEndpoint[] = [
  { id: 'settings.find', version: 'v1', method: 'GET', path: '/api/v1/settings/find/:instance', name: 'Find Settings', category: 'Settings', rateLimit: 'read',
    desc: 'Fetch the current instance settings.', pathParams: [INSTANCE], bodyFields: [], evolutionPath: '/settings/find/{instance}' },
  { id: 'settings.set', version: 'v1', method: 'POST', path: '/api/v1/settings/set/:instance', name: 'Set Settings', category: 'Settings', rateLimit: 'strict',
    desc: 'Update instance settings (call rejection, online status, history sync, etc.).',
    pathParams: [INSTANCE],
    bodyFields: [
      { key: 'rejectCall', label: 'Reject calls', type: 'boolean' },
      { key: 'msgCall', label: 'Call message', type: 'string', placeholder: 'Sorry, I cannot answer calls.' },
      { key: 'groupsIgnore', label: 'Ignore groups', type: 'boolean' },
      { key: 'alwaysOnline', label: 'Always online', type: 'boolean' },
      { key: 'readMessages', label: 'Read messages', type: 'boolean' },
      { key: 'readStatus', label: 'Read status', type: 'boolean' },
      { key: 'syncFullHistory', label: 'Sync full history', type: 'boolean' },
    ], evolutionPath: '/settings/set/{instance}' },
];
