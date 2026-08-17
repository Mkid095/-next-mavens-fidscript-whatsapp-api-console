// Event catalog - thin barrel aggregating all event interface groups.
export type {
  MessageReceivedPayload,
  MessageSentPayload,
  MessageDeliveredPayload,
  MessageReadPayload,
  MessageFailedPayload,
  ConversationCreatedPayload,
  ConversationAssignedPayload,
  ConversationPriorityChangedPayload,
  ConversationStatusChangedPayload,
  SlaResponseDuePayload,
  SlaBreachedPayload,
} from './catalogMessageEvents.js';

export type {
  CustomerCreatedPayload,
  CustomerTaggedPayload,
  CustomerNotedPayload,
  CampaignStartedPayload,
  CampaignCompletedPayload,
  AutomationTriggeredPayload,
  FlowStartedPayload,
  FlowStepPayload,
  FlowCompletedPayload,
} from './catalogCoreEvents.js';

export type {
  AiReplyGeneratedPayload,
  AiHandoffRequestedPayload,
  AiStateChangedPayload,
  IntegrationConnectedPayload,
  IntegrationSyncedPayload,
  OrderCreatedPayload,
  OrderFulfilledPayload,
  InventoryUpdatedPayload,
  KnowledgeIndexedPayload,
} from './catalogPlatformEvents.js';
