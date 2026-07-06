// Human handoff actions — barrel
export type { ConversationState, HandoffResult } from './handoffImpl.js';
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
} from './handoffImpl.js';
