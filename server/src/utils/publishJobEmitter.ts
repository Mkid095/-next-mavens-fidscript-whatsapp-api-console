import { EventEmitter } from 'events';

/**
 * SSE event emitter for chatbot publish job updates.
 * Emits keyed by jobId string.
 */
export const publishJobEmitter = new EventEmitter();
publishJobEmitter.setMaxListeners(200);
