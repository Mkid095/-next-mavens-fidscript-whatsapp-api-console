/**
 * FIDScript public API (v1) client - `/api/v1`.
 *
 * Integrators authenticate with an `X-API-Key` (`fidscript_live_…`). The
 * dashboard Sandbox passes the key through too. All send methods accept an
 * optional `idempotencyKey` so a retried request returns the cached result
 * instead of sending twice. Response shape: { success, data?, error? }.
 */
import { fetchApi, type ApiResponse } from './api';

export interface SendResponse {
  messageId: string;
  to?: string;
  timestamp: string;
  [k: string]: unknown;
}

export type ContactCard = { fullName: string; wuid?: string; phoneNumber: string; organization?: string };
export type MessageKey = { remoteJid: string; fromMe: boolean; id: string };
export type ListSection = { title: string; rows: { title: string; description?: string; rowId: string }[] };

function v1Send<T = SendResponse>(path: string, apiKey: string, body: Record<string, unknown>, idempotencyKey?: string): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'X-API-Key': apiKey };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  return fetchApi<T>(path, { method: 'POST', headers, body: JSON.stringify(body) });
}

/** Generic v1 call for management/read ops (any method, optional body + query). */
function v1Req<T = unknown>(method: string, path: string, apiKey: string, opts: { body?: Record<string, unknown>; query?: Record<string, unknown> } = {}): Promise<ApiResponse<T>> {
  const qs = opts.query
    ? '?' + Object.entries(opts.query).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
    : '';
  return fetchApi<T>(`${path}${qs}`, { method, headers: { 'X-API-Key': apiKey }, body: opts.body ? JSON.stringify(opts.body) : undefined });
}

type GroupArgs = Record<string, unknown>;
export const groups = {
  create: (i: string, k: string, b: GroupArgs) => v1Req('POST', `/api/v1/groups/create/${i}`, k, { body: b }),
  updateSubject: (i: string, k: string, b: GroupArgs) => v1Req('POST', `/api/v1/groups/update-subject/${i}`, k, { body: b }),
  updateDescription: (i: string, k: string, b: GroupArgs) => v1Req('POST', `/api/v1/groups/update-description/${i}`, k, { body: b }),
  updatePicture: (i: string, k: string, b: GroupArgs) => v1Req('POST', `/api/v1/groups/update-picture/${i}`, k, { body: b }),
  fetchAll: (i: string, k: string, getParticipants = false) => v1Req('GET', `/api/v1/groups/fetch-all/${i}`, k, { query: { getParticipants } }),
  find: (i: string, k: string, groupJid: string) => v1Req('GET', `/api/v1/groups/find/${i}`, k, { query: { groupJid } }),
  findMembers: (i: string, k: string, groupJid: string) => v1Req('GET', `/api/v1/groups/find-members/${i}`, k, { query: { groupJid } }),
  updateParticipant: (i: string, k: string, b: GroupArgs) => v1Req('POST', `/api/v1/groups/update-participant/${i}`, k, { body: b }),
  inviteCode: (i: string, k: string, groupJid: string) => v1Req('GET', `/api/v1/groups/invite-code/${i}`, k, { query: { groupJid } }),
  revokeInvite: (i: string, k: string, groupJid: string) => v1Req('POST', `/api/v1/groups/revoke-invite/${i}`, k, { body: { groupJid } }),
  findByInvite: (i: string, k: string, inviteCode: string) => v1Req('GET', `/api/v1/groups/find-by-invite/${i}`, k, { query: { inviteCode } }),
  acceptInvite: (i: string, k: string, inviteCode: string) => v1Req('GET', `/api/v1/groups/accept-invite/${i}`, k, { query: { inviteCode } }),
  sendInvite: (i: string, k: string, b: GroupArgs) => v1Req('POST', `/api/v1/groups/send-invite/${i}`, k, { body: b }),
  leave: (i: string, k: string, groupJid: string) => v1Req('DELETE', `/api/v1/groups/leave/${i}`, k, { query: { groupJid } }),
  toggleEphemeral: (i: string, k: string, b: GroupArgs) => v1Req('POST', `/api/v1/groups/toggle-ephemeral/${i}`, k, { body: b }),
  updateSetting: (i: string, k: string, b: GroupArgs) => v1Req('POST', `/api/v1/groups/update-setting/${i}`, k, { body: b }),
};

type ChatArgs = Record<string, unknown>;
export const chats = {
  markRead: (i: string, k: string, b: ChatArgs) => v1Req('POST', `/api/v1/chats/mark-read/${i}`, k, { body: b }),
  markUnread: (i: string, k: string, b: ChatArgs) => v1Req('POST', `/api/v1/chats/mark-unread/${i}`, k, { body: b }),
  archive: (i: string, k: string, b: ChatArgs) => v1Req('POST', `/api/v1/chats/archive/${i}`, k, { body: b }),
  presence: (i: string, k: string, b: ChatArgs) => v1Req('POST', `/api/v1/chats/presence/${i}`, k, { body: b }),
  deleteForEveryone: (i: string, k: string, b: ChatArgs) => v1Req('DELETE', `/api/v1/chats/delete-for-everyone/${i}`, k, { body: b }),
  updateMessage: (i: string, k: string, b: ChatArgs) => v1Req('POST', `/api/v1/chats/update-message/${i}`, k, { body: b }),
  findChats: (i: string, k: string) => v1Req('POST', `/api/v1/chats/find-chats/${i}`, k),
  findContacts: (i: string, k: string, where?: ChatArgs) => v1Req('POST', `/api/v1/chats/find-contacts/${i}`, k, { body: where }),
  findMessages: (i: string, k: string, where?: ChatArgs) => v1Req('POST', `/api/v1/chats/find-messages/${i}`, k, { body: where }),
  findStatus: (i: string, k: string, where?: ChatArgs, limit = 10) => v1Req('POST', `/api/v1/chats/find-status/${i}`, k, { body: { where, limit } }),
  isWhatsApp: (i: string, k: string, numbers: string[]) => v1Req('POST', `/api/v1/chats/is-whatsapp/${i}`, k, { body: { numbers } }),
  getBase64: (i: string, k: string, b: ChatArgs) => v1Req('POST', `/api/v1/chats/base64/${i}`, k, { body: b }),
  profilePicUrl: (i: string, k: string, number: string) => v1Req('GET', `/api/v1/chats/profile-pic-url/${i}`, k, { query: { number } }),
};

type ProfileArgs = Record<string, unknown>;
export const profile = {
  fetch: (i: string, k: string, number: string) => v1Req('POST', `/api/v1/profile/fetch/${i}`, k, { body: { number } }),
  fetchPrivacy: (i: string, k: string) => v1Req('GET', `/api/v1/profile/fetch-privacy/${i}`, k),
  updateName: (i: string, k: string, name: string) => v1Req('POST', `/api/v1/profile/update-name/${i}`, k, { body: { name } }),
  updateStatus: (i: string, k: string, status: string) => v1Req('POST', `/api/v1/profile/update-status/${i}`, k, { body: { status } }),
  updatePicture: (i: string, k: string, picture: string) => v1Req('POST', `/api/v1/profile/update-picture/${i}`, k, { body: { picture } }),
  removePicture: (i: string, k: string) => v1Req('DELETE', `/api/v1/profile/remove-picture/${i}`, k),
};

export const settings = {
  find: (i: string, k: string) => v1Req('GET', `/api/v1/settings/find/${i}`, k),
  set: (i: string, k: string, b: ProfileArgs) => v1Req('POST', `/api/v1/settings/set/${i}`, k, { body: b }),
};

type InstanceArgs = Record<string, unknown>;
export const instance = {
  connectionState: (i: string, k: string) => v1Req('GET', `/api/v1/instance/connection-state/${i}`, k),
  connect: (i: string, k: string, number?: string) => v1Req('GET', `/api/v1/instance/connect/${i}${number ? `?number=${encodeURIComponent(number)}` : ''}`, k),
  restart: (i: string, k: string, confirm = true) => v1Req('POST', `/api/v1/instance/restart/${i}`, k, { body: { confirm } }),
  logout: (i: string, k: string) => v1Req('DELETE', `/api/v1/instance/logout/${i}`, k),
  setPresence: (i: string, k: string, presence: 'available' | 'unavailable') => v1Req('POST', `/api/v1/instance/set-presence/${i}`, k, { body: { presence } }),
  qr: (i: string, k: string, number?: string) => v1Req('GET', `/api/v1/instance/qr/${i}${number ? `?number=${encodeURIComponent(number)}` : ''}`, k),
};

export const apiV1 = {
  /** Validate an API key with no side effects. */
  whoami: (apiKey: string) =>
    fetchApi<{ client: string; key_id: string }>(`/api/v1/whoami`, { method: 'GET', headers: { 'X-API-Key': apiKey } }),

  /** Aggregate usage for the authenticated client. */
  usage: (apiKey: string) =>
    fetchApi<{ requestsToday: number; requestsMonth: number; sendsMonth: number; tokenSpendMonth: number; failedRequestsMonth: number }>(
      `/api/v1/usage`, { method: 'GET', headers: { 'X-API-Key': apiKey } },
    ),

  sendText: (instance: string, apiKey: string, to: string, message: string, idempotencyKey?: string) =>
    v1Send(`/api/v1/messages/text/${instance}`, apiKey, { to, message }, idempotencyKey),

  sendMedia: (instance: string, apiKey: string, to: string, media_url: string, media_type = 'image', caption?: string, idempotencyKey?: string) =>
    v1Send(`/api/v1/messages/media/${instance}`, apiKey, { to, media_url, media_type, caption }, idempotencyKey),

  sendLocation: (instance: string, apiKey: string, to: string, latitude: number, longitude: number, name?: string, address?: string, idempotencyKey?: string) =>
    v1Send(`/api/v1/messages/location/${instance}`, apiKey, { to, latitude, longitude, name, address }, idempotencyKey),

  sendContact: (instance: string, apiKey: string, to: string, contact: ContactCard[], idempotencyKey?: string) =>
    v1Send(`/api/v1/messages/contact/${instance}`, apiKey, { to, contact }, idempotencyKey),

  sendReaction: (instance: string, apiKey: string, to: string, key: MessageKey, reaction: string, idempotencyKey?: string) =>
    v1Send(`/api/v1/messages/reaction/${instance}`, apiKey, { to, key, reaction }, idempotencyKey),

  sendPoll: (instance: string, apiKey: string, to: string, name: string, selectableCount: number, values: string[], idempotencyKey?: string) =>
    v1Send(`/api/v1/messages/poll/${instance}`, apiKey, { to, name, selectableCount, values }, idempotencyKey),

  sendList: (instance: string, apiKey: string, to: string, title: string, buttonText: string, sections: ListSection[], opts?: { description?: string; footerText?: string; idempotencyKey?: string }) =>
    v1Send(`/api/v1/messages/list/${instance}`, apiKey, { to, title, buttonText, sections, description: opts?.description, footerText: opts?.footerText }, opts?.idempotencyKey),

  sendAudio: (instance: string, apiKey: string, to: string, audio: string, idempotencyKey?: string) =>
    v1Send(`/api/v1/messages/audio/${instance}`, apiKey, { to, audio }, idempotencyKey),

  sendSticker: (instance: string, apiKey: string, to: string, sticker: string, idempotencyKey?: string) =>
    v1Send(`/api/v1/messages/sticker/${instance}`, apiKey, { to, sticker }, idempotencyKey),

  sendStatus: (instance: string, apiKey: string, args: { type: 'text' | 'image' | 'audio'; content: string; caption?: string; backgroundColor?: string; font?: number; allContacts?: boolean; statusJidList?: string[] }, idempotencyKey?: string) =>
    v1Send(`/api/v1/messages/status/${instance}`, apiKey, args, idempotencyKey),
};
