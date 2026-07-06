// Thin barrel — all handoff logic lives in handoffActions/index.js
export type { ConversationState, HandoffResult } from './handoffActions/index.js';
export {
  setConversationState,
  getConversationState,
  assignConversation,
  releaseConversation,
  closeConversation,
  resumeBot,
  requestHandoff,
  getWaitingConversations,
  onHumanReply,
  evaluateHandoffRules,
} from './handoffActions/index.js';
