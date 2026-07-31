// Platform Events module — forwarding re-export from canonical kernel location.
export { bus, _resetBus } from '../../../kernel/events/index.js';
export type { EventBus } from '../../../kernel/events/index.js';
export { logDomainEvent } from '../../../kernel/events/index.js';
export {
  dispatchMessageReceived, dispatchMessageSent, dispatchMessageDelivered,
  dispatchMessageRead, dispatchMessageFailed, dispatchConversationCreated,
  dispatchConversationAssigned, dispatchConversationPriorityChanged,
  dispatchConversationStatusChanged, dispatchSlaResponseDue, dispatchSlaBreached,
  dispatchCustomerCreated, dispatchCustomerTagged, dispatchCustomerNoted,
  dispatchCampaignStarted, dispatchCampaignCompleted, dispatchAutomationTriggered,
  dispatchFlowStarted, dispatchFlowStep, dispatchFlowCompleted,
  dispatchIntegrationConnected, dispatchIntegrationSynced, dispatchOrderCreated,
  dispatchOrderFulfilled, dispatchInventoryUpdated, dispatchKnowledgeIndexed,
  dispatchShopifyOrderCreated, dispatchShopifyOrderUpdated,
  dispatchWooCommerceOrderCreated, dispatchSystemError,
} from '../../../kernel/events/index.js';
export type {
  DomainEventType, DomainEventPayload,
  MessageReceivedPayload, MessageSentPayload, MessageDeliveredPayload,
  MessageReadPayload, MessageFailedPayload, ConversationCreatedPayload,
  ConversationAssignedPayload, ConversationPriorityChangedPayload,
  ConversationStatusChangedPayload, SlaResponseDuePayload, SlaBreachedPayload,
  CustomerCreatedPayload, CustomerTaggedPayload, CustomerNotedPayload,
  CampaignStartedPayload, CampaignCompletedPayload, AutomationTriggeredPayload,
  FlowStartedPayload, FlowStepPayload, FlowCompletedPayload,
  IntegrationConnectedPayload, IntegrationSyncedPayload, OrderCreatedPayload,
  OrderFulfilledPayload, InventoryUpdatedPayload, KnowledgeIndexedPayload,
  ShopifyOrderCreatedPayload, ShopifyOrderUpdatedPayload,
  WooCommerceOrderCreatedPayload, SystemErrorPayload,
} from '../../../kernel/events/index.js';
export type { DispatchContext } from '../../../kernel/events/index.js';
