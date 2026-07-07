import { EventEmitter } from 'events';

/**
 * SSE event emitter for client-scoped dashboard events:
 * message count updates, new message notifications.
 *
 * Emits keyed by client_id string.
 */
export const dashboardEmitter = new EventEmitter();
dashboardEmitter.setMaxListeners(100);

/**
 * Emit a dashboard stats refresh request to all SSE connections subscribed to this client.
 */
export function emitDashboardRefresh(clientId: string) {
  dashboardEmitter.emit('msgUpdate', clientId, {});
}
