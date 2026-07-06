// =============================================================================
// Event type definitions — single source of truth for all domain events.
// Append-only. Every event type must be defined here.
// =============================================================================

// ---------------------------------------------------------------------------
// Dispatch context
// ---------------------------------------------------------------------------
export interface DispatchContext {
  workspaceId: string | null;
  actorUserId?: string | null;
  roleId?: string;
  perms?: string[];
}

// ---------------------------------------------------------------------------
// Message events
// ---------------------------------------------------------------------------
export interface MessageReceivedPayload {
  conversationId: string;
  customerId: string;
  channel: string;
  messageId: string;
  messageType: string;
  content: string;
  mediaUrl?: string | null;
  fromNumber: string;
  fromName?: string | null;
}

export interface MessageSentPayload {
  conversationId: string;
  customerId: string;
  messageId: string;
  messageType: string;
  content: string;
  toNumber: string;
}

export interface MessageDeliveredPayload {
  conversationId: string;
  messageId: string;
}

export interface MessageReadPayload {
  conversationId: string;
  messageId: string;
}

export interface MessageFailedPayload {
  conversationId: string;
  messageId: string;
  error: string;
}

// ---------------------------------------------------------------------------
// Conversation events
// ---------------------------------------------------------------------------
export interface ConversationCreatedPayload {
  conversationId: string;
  customerId: string;
  channel: string;
  instanceId?: string;
  chatId: string;
}

export interface ConversationAssignedPayload {
  conversationId: string;
  assigneeType: 'user' | 'team' | 'unassigned';
  assigneeId: string | null;
  byUserId: string;
}

export interface ConversationPriorityChangedPayload {
  conversationId: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  byUserId: string;
}

export interface ConversationStatusChangedPayload {
  conversationId: string;
  status: 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed';
  byUserId?: string;
}

// ---------------------------------------------------------------------------
// SLA events
// ---------------------------------------------------------------------------
export interface SlaResponseDuePayload {
  conversationId: string;
  policyId: string;
}

export interface SlaBreachedPayload {
  conversationId: string;
  policyId: string;
  kind: 'response' | 'resolution';
}

// ---------------------------------------------------------------------------
// Customer events
// ---------------------------------------------------------------------------
export interface CustomerCreatedPayload {
  customerId: string;
  channel: string;
  identifier: string;
  displayName?: string | null;
}

export interface CustomerTaggedPayload {
  customerId: string;
  tag: string;
  byUserId?: string;
}

export interface CustomerNotedPayload {
  customerId: string;
  noteId: string;
  byUserId: string;
}

// ---------------------------------------------------------------------------
// Campaign events
// ---------------------------------------------------------------------------
export interface CampaignStartedPayload {
  campaignId: string;
  stats: { totalRecipients: number };
}

export interface CampaignCompletedPayload {
  campaignId: string;
  stats: {
    sent: number;
    delivered: number;
    failed: number;
  };
}

// ---------------------------------------------------------------------------
// Automation events
// ---------------------------------------------------------------------------
export interface AutomationTriggeredPayload {
  flowId: string;
  triggerEvent: string;
  conversationId?: string;
  customerId?: string;
}

export interface FlowStartedPayload {
  flowId: string;
  executionId: string;
  customerId?: string;
  conversationId?: string;
}

export interface FlowStepPayload {
  flowId: string;
  executionId: string;
  nodeId: string;
}

export interface FlowCompletedPayload {
  flowId: string;
  executionId: string;
}

// ---------------------------------------------------------------------------
// AI events
// ---------------------------------------------------------------------------
export interface AiReplyGeneratedPayload {
  agentId: string;
  conversationId: string;
  messageId: string;
  confidence: number;
}

export interface AiHandoffRequestedPayload {
  agentId: string;
  conversationId: string;
  reason: string;
  confidence: number;
}

export interface AiStateChangedPayload {
  conversationId: string;
  state: 'ai_active' | 'ai_paused' | 'human_active' | 'escalated';
  byUserId?: string;
}

// ---------------------------------------------------------------------------
// Integration events
// ---------------------------------------------------------------------------
export interface IntegrationConnectedPayload {
  integrationId: string;
  connector: string;
}

export interface IntegrationSyncedPayload {
  integrationId: string;
  connector: string;
  eventCount: number;
}

// ---------------------------------------------------------------------------
// Order events
// ---------------------------------------------------------------------------
export interface OrderCreatedPayload {
  orderId: string;
  customerId: string;
  total: number;
  currency: string;
}

export interface OrderFulfilledPayload {
  orderId: string;
  customerId: string;
}

export interface InventoryUpdatedPayload {
  productId: string;
  connector: string;
}

// ---------------------------------------------------------------------------
// Knowledge events
// ---------------------------------------------------------------------------
export interface KnowledgeIndexedPayload {
  sourceId: string;
}

// ---------------------------------------------------------------------------
// Union type — exhaustive switch in dispatch.ts uses this
// ---------------------------------------------------------------------------
export type DomainEventType =
  // Messages
  | 'message.received'
  | 'message.sent'
  | 'message.delivered'
  | 'message.read'
  | 'message.failed'
  // Conversations
  | 'conversation.created'
  | 'conversation.assigned'
  | 'conversation.priority_changed'
  | 'conversation.status_changed'
  // SLA
  | 'sla.response_due'
  | 'sla.breached'
  // Customers
  | 'customer.created'
  | 'customer.tagged'
  | 'customer.noted'
  // Campaigns
  | 'campaign.started'
  | 'campaign.completed'
  // Automation
  | 'automation.triggered'
  | 'flow.started'
  | 'flow.step'
  | 'flow.completed'
  // AI
  | 'ai.reply.generated'
  | 'ai.handoff_requested'
  | 'ai.state_changed'
  // Integrations
  | 'integration.connected'
  | 'integration.synced'
  // Orders
  | 'order.created'
  | 'order.fulfilled'
  | 'inventory.updated'
  // Knowledge
  | 'knowledge.indexed';

export type DomainEventPayload =
  | MessageReceivedPayload
  | MessageSentPayload
  | MessageDeliveredPayload
  | MessageReadPayload
  | MessageFailedPayload
  | ConversationCreatedPayload
  | ConversationAssignedPayload
  | ConversationPriorityChangedPayload
  | ConversationStatusChangedPayload
  | SlaResponseDuePayload
  | SlaBreachedPayload
  | CustomerCreatedPayload
  | CustomerTaggedPayload
  | CustomerNotedPayload
  | CampaignStartedPayload
  | CampaignCompletedPayload
  | AutomationTriggeredPayload
  | FlowStartedPayload
  | FlowStepPayload
  | FlowCompletedPayload
  | AiReplyGeneratedPayload
  | AiHandoffRequestedPayload
  | AiStateChangedPayload
  | IntegrationConnectedPayload
  | IntegrationSyncedPayload
  | OrderCreatedPayload
  | OrderFulfilledPayload
  | InventoryUpdatedPayload
  | KnowledgeIndexedPayload;
