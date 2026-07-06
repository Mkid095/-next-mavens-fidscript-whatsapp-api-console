// Event dispatch handlers — thin barrel aggregating all dispatch groups.
export { emit, type DispatchContext } from './dispatchCore.js';

export {
  dispatchMessageReceived,
  dispatchMessageSent,
  dispatchMessageDelivered,
  dispatchMessageRead,
  dispatchMessageFailed,
  dispatchConversationCreated,
  dispatchConversationAssigned,
  dispatchConversationPriorityChanged,
  dispatchConversationStatusChanged,
  dispatchSlaResponseDue,
  dispatchSlaBreached,
} from './dispatchMessages.js';

export {
  dispatchCustomerCreated,
  dispatchCustomerTagged,
  dispatchCustomerNoted,
  dispatchCampaignStarted,
  dispatchCampaignCompleted,
  dispatchAutomationTriggered,
  dispatchFlowStarted,
  dispatchFlowStep,
  dispatchFlowCompleted,
} from './dispatchCustomers.js';

export {
  dispatchAiReplyGenerated,
  dispatchAiHandoffRequested,
  dispatchAiStateChanged,
  dispatchIntegrationConnected,
  dispatchIntegrationSynced,
  dispatchOrderCreated,
  dispatchOrderFulfilled,
  dispatchInventoryUpdated,
  dispatchKnowledgeIndexed,
} from './dispatchPlatform.js';
