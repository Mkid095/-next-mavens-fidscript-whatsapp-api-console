/**
 * Chatbot Handlers — thin re-export layer.
 *
 * Sub-modules:
 *   - chatbotCrudHandlers.ts      — list, get, create, update, delete, toggle
 *   - chatbotConfigHandlers.ts   — AI config, triggers, rules, handoff, policies,
 *                                   group-settings, contacts, test trigger
 *   - chatbotPublishHandlers.ts  — publishChatbot, getPublishJob
 *   - chatbotInspectHandlers.ts  — health, test-config, versions, rollback,
 *                                   duplicate, token-forecast, tools, inspector
 */

export {
  listChatbots,
  getChatbot,
  createChatbot,
  updateChatbot,
  deleteChatbot,
  toggleChatbot,
  wsId,
} from './chatbotCrudHandlers.js';

export {
  updateAiConfig,
  createTrigger,
  deleteTrigger,
  createRule,
  updateRule,
  deleteRule,
  createHandoffRule,
  updatePolicies,
  saveGroupSettings,
  assignContact,
  unassignContact,
  testTrigger,
  wsId as configWsId,
} from './chatbotConfigHandlers.js';

export {
  publishChatbot,
  getPublishJob,
  wsId as publishWsId,
} from './chatbotPublishHandlers.js';

export {
  healthCheck,
  testConfig,
  getVersions,
  rollbackChatbot,
  duplicateChatbot,
  tokenForecast,
  getTools,
  attachTools,
  detachTool,
  getInspectorConversations,
  replayChatbot,
  wsId as inspectWsId,
} from './chatbotInspectHandlers.js';
