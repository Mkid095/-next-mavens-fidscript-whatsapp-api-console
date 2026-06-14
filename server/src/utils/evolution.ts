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
 * Evolution API response - shape varies by endpoint.
 * Using `any` here would defeat the purpose, so we use a loose object type
 * that allows property access while acknowledging the varied response shapes.
 * Individual route handlers narrow the type as needed.
 */
export type EvolutionAPIResponse = {
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

export async function callEvolutionAPI(method: string, endpoint: string, body?: object): Promise<EvolutionAPIResponse> {
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
  return response.json() as Promise<EvolutionAPIResponse>;
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
export function emitNewMessage(instanceName: string, message: { id: string; from_number: string; from_name: string; message_type: string; content: string; media_url: string | null; timestamp: string }) {
  instanceEmitter.emit('newMessage', instanceName, message);
}

export function generateInstanceToken(): string {
  return `inst_${crypto.randomBytes(16).toString('hex')}`;
}
