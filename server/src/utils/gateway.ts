import crypto from 'crypto';
import { EventEmitter } from 'events';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '94977bc1fcb107c79d0687caea800bdb74edd67b5022771fc85c22ee389ca7e8';

/**
 * SSE event emitter for instance connection state changes.
 * Emits events keyed by instance name (URL-encoded).
 */
export const instanceEmitter = new EventEmitter();
instanceEmitter.setMaxListeners(100); // Allow many concurrent SSE connections

/**
 * the gateway API response - shape varies by endpoint.
 * Using `any` here would defeat the purpose, so we use a loose object type
 * that allows property access while acknowledging the varied response shapes.
 * Individual route handlers narrow the type as needed.
 */
export type GatewayResponse = {
  /** Common envelope fields */
  success?: boolean;
  response?: string | object;
  message?: string;
  error?: string;
  /** Instance create/connect response */
  instance?: { state?: string; phone?: string; phone_number?: string };
  /** QR code response */
  qrcode?: { code?: string; base64?: string; pairingCode?: string; link_code?: string };
  /** Connection state response */
  state?: string;
  /** Direct QR fields (flat response) */
  code?: string;
  base64?: string;
  pairingCode?: string;
  link_code?: string;
  /** Allow any additional properties */
  [key: string]: unknown;
};

export async function callGateway(method: string, endpoint: string, body?: object): Promise<GatewayResponse> {
  const url = `${EVOLUTION_API_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  return response.json() as Promise<GatewayResponse>;
}

/**
 * Checked variant for management/read operations (groups, chats, profile,
 * instance). Unlike callGateway, this exposes the HTTP status so callers
 * can distinguish success from gateway errors. `ok` mirrors response.ok.
 */
export interface CheckedResult {
  ok: boolean;
  status: number;
  data: GatewayResponse;
}

export async function callGatewayChecked(method: string, endpoint: string, body?: object): Promise<CheckedResult> {
  const url = `${EVOLUTION_API_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  let data: GatewayResponse = {};
  try { data = await response.json() as GatewayResponse; } catch { /* non-JSON body */ }
  return { ok: response.ok, status: response.status, data };
}

/**
 * Emit a connection state change event for an instance.
 * Used by SSE route to broadcast to subscribed clients.
 */
export function emitInstanceStateChange(instanceName: string, state: string, phoneNumber: string | null) {
  instanceEmitter.emit('stateChange', instanceName, { state, phoneNumber });
}

/**
 * Emit a new inbox message event for an instance.
 * Used by webhook to broadcast incoming messages to subscribed clients.
 */
export function emitNewMessage(instanceName: string, message: { id: string; from_number: string; from_name: string; message_type: string; content: string; media_url: string | null; timestamp: string; chat_id: string; is_group: number }) {
  instanceEmitter.emit('newMessage', instanceName, message);
}

export function emitTokenUpdate(instanceName: string, newBalance: number) {
  instanceEmitter.emit('tokenUpdate', instanceName, { balance: newBalance });
}

/**
 * Emit a read/delivered receipt event for an instance (recipient read our msg).
 * Pushed to SSE so the inbox flips the message to a blue read tick in real time.
 */
export function emitMessageReceipt(instanceName: string, chatId: string, messageId: string, status: string) {
  instanceEmitter.emit('messageReceipt', instanceName, { chatId, messageId, status });
}

/**
 * Emit a presence/typing event for an instance (recipient is composing).
 * Ephemeral — pushed to SSE so the inbox shows a typing indicator.
 */
export function emitPresence(instanceName: string, chatId: string, presence: string, fromName?: string | null) {
  instanceEmitter.emit('presence', instanceName, { chatId, presence, fromName: fromName ?? null });
}

export function generateInstanceToken(): string {
  return `inst_${crypto.randomBytes(16).toString('hex')}`;
}
