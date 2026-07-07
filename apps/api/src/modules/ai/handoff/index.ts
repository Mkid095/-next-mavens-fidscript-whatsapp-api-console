/**
 * Human handoff barrel — re-exports all public API.
 */
export type { ConversationState, HandoffResult } from './state.js';
export { setConversationState, getConversationState, assignConversation, releaseConversation, closeConversation, resumeBot, onHumanReply, getWaitingConversations } from './state.js';
export { requestHandoff, notifyHandoff } from './notifications.js';
export { evaluateHandoffRules } from './rules.js';
