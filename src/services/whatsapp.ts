/**
 * FIDScript public API (v1) client — `/api/v1`.
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
