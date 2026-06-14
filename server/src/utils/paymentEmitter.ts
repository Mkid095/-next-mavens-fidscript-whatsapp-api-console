import { EventEmitter } from 'events';

/**
 * SSE event emitter for client-scoped real-time events:
 * token balance updates (from payment callbacks), payment status changes.
 *
 * Emits keyed by client_id string.
 */
export const paymentEmitter = new EventEmitter();
paymentEmitter.setMaxListeners(100);

export interface TokenUpdate {
  balance: number;
  transaction_id: string;
  mpesa_receipt?: string;
}

/**
 * Emit a token balance update to all SSE connections subscribed to this client.
 */
export function emitTokenUpdate(clientId: string, update: TokenUpdate) {
  paymentEmitter.emit('tokenUpdate', clientId, update);
}
