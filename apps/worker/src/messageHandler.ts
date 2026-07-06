/**
 * Chatbot Worker — thin re-export barrel.
 * All logic moved to processMessage.ts and messageHandlerUtils.ts.
 */

export { processMessage, type InboundMessage } from './processMessage.js';
export { type SendResult } from './messageHandlerUtils.js';
