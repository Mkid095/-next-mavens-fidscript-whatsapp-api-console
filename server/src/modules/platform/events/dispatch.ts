import { bus } from './bus.js';
import { logDomainEvent } from './log.js';
import type {
  DomainEventType,
  DomainEventPayload,
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
  CustomerCreatedPayload,
  CustomerTaggedPayload,
  CustomerNotedPayload,
  CampaignStartedPayload,
  CampaignCompletedPayload,
  AutomationTriggeredPayload,
  FlowStartedPayload,
  FlowStepPayload,
  FlowCompletedPayload,
  AiReplyGeneratedPayload,
  AiHandoffRequestedPayload,
  AiStateChangedPayload,
  IntegrationConnectedPayload,
  IntegrationSyncedPayload,
  OrderCreatedPayload,
  OrderFulfilledPayload,
  InventoryUpdatedPayload,
  KnowledgeIndexedPayload,
} from './catalog.js';

// =============================================================================
// Dispatch helpers — one per event type.
// Each helper calls bus.emit() AND logDomainEvent() in one call.
// Every helper extracts workspaceId from context and sets entity ids.
// =============================================================================

export interface DispatchContext {
  workspaceId: string | null;
  actorUserId?: string | null;
  roleId?: string;
  perms?: string[];
}

async function emit<T extends DomainEventType>(
  type: T,
  payload: DomainEventPayload,
  ctx: DispatchContext
): Promise<void> {
  await bus().emit(type, payload);
  logDomainEvent(ctx.workspaceId, type, payload, ctx.actorUserId ?? null);
}

// ---------------------------------------------------------------------------
// Message events
// ---------------------------------------------------------------------------

export async function dispatchMessageReceived(
  ctx: DispatchContext,
  payload: Omit<MessageReceivedPayload, 'conversationId' | 'customerId'> & {
    conversationId: string;
    customerId: string;
  }
): Promise<void> {
  await emit('message.received', payload as MessageReceivedPayload, ctx);
}

export async function dispatchMessageSent(
  ctx: DispatchContext,
  payload: Omit<MessageSentPayload, 'conversationId' | 'customerId'> & {
    conversationId: string;
    customerId: string;
  }
): Promise<void> {
  await emit('message.sent', payload as MessageSentPayload, ctx);
}

export async function dispatchMessageDelivered(
  ctx: DispatchContext,
  payload: MessageDeliveredPayload
): Promise<void> {
  await emit('message.delivered', payload, ctx);
}

export async function dispatchMessageRead(
  ctx: DispatchContext,
  payload: MessageReadPayload
): Promise<void> {
  await emit('message.read', payload, ctx);
}

export async function dispatchMessageFailed(
  ctx: DispatchContext,
  payload: MessageFailedPayload
): Promise<void> {
  await emit('message.failed', payload, ctx);
}

// ---------------------------------------------------------------------------
// Conversation events
// ---------------------------------------------------------------------------

export async function dispatchConversationCreated(
  ctx: DispatchContext,
  payload: ConversationCreatedPayload
): Promise<void> {
  await emit('conversation.created', payload, ctx);
}

export async function dispatchConversationAssigned(
  ctx: DispatchContext,
  payload: ConversationAssignedPayload
): Promise<void> {
  await emit('conversation.assigned', payload, ctx);
}

export async function dispatchConversationPriorityChanged(
  ctx: DispatchContext,
  payload: ConversationPriorityChangedPayload
): Promise<void> {
  await emit('conversation.priority_changed', payload, ctx);
}

export async function dispatchConversationStatusChanged(
  ctx: DispatchContext,
  payload: ConversationStatusChangedPayload
): Promise<void> {
  await emit('conversation.status_changed', payload, ctx);
}

// ---------------------------------------------------------------------------
// SLA events
// ---------------------------------------------------------------------------

export async function dispatchSlaResponseDue(
  ctx: DispatchContext,
  payload: SlaResponseDuePayload
): Promise<void> {
  await emit('sla.response_due', payload, ctx);
}

export async function dispatchSlaBreached(
  ctx: DispatchContext,
  payload: SlaBreachedPayload
): Promise<void> {
  await emit('sla.breached', payload, ctx);
}

// ---------------------------------------------------------------------------
// Customer events
// ---------------------------------------------------------------------------

export async function dispatchCustomerCreated(
  ctx: DispatchContext,
  payload: CustomerCreatedPayload
): Promise<void> {
  await emit('customer.created', payload, ctx);
}

export async function dispatchCustomerTagged(
  ctx: DispatchContext,
  payload: CustomerTaggedPayload
): Promise<void> {
  await emit('customer.tagged', payload, ctx);
}

export async function dispatchCustomerNoted(
  ctx: DispatchContext,
  payload: CustomerNotedPayload
): Promise<void> {
  await emit('customer.noted', payload, ctx);
}

// ---------------------------------------------------------------------------
// Campaign events
// ---------------------------------------------------------------------------

export async function dispatchCampaignStarted(
  ctx: DispatchContext,
  payload: CampaignStartedPayload
): Promise<void> {
  await emit('campaign.started', payload, ctx);
}

export async function dispatchCampaignCompleted(
  ctx: DispatchContext,
  payload: CampaignCompletedPayload
): Promise<void> {
  await emit('campaign.completed', payload, ctx);
}

// ---------------------------------------------------------------------------
// Automation events
// ---------------------------------------------------------------------------

export async function dispatchAutomationTriggered(
  ctx: DispatchContext,
  payload: AutomationTriggeredPayload
): Promise<void> {
  await emit('automation.triggered', payload, ctx);
}

export async function dispatchFlowStarted(
  ctx: DispatchContext,
  payload: FlowStartedPayload
): Promise<void> {
  await emit('flow.started', payload, ctx);
}

export async function dispatchFlowStep(
  ctx: DispatchContext,
  payload: FlowStepPayload
): Promise<void> {
  await emit('flow.step', payload, ctx);
}

export async function dispatchFlowCompleted(
  ctx: DispatchContext,
  payload: FlowCompletedPayload
): Promise<void> {
  await emit('flow.completed', payload, ctx);
}

// ---------------------------------------------------------------------------
// AI events
// ---------------------------------------------------------------------------

export async function dispatchAiReplyGenerated(
  ctx: DispatchContext,
  payload: AiReplyGeneratedPayload
): Promise<void> {
  await emit('ai.reply.generated', payload, ctx);
}

export async function dispatchAiHandoffRequested(
  ctx: DispatchContext,
  payload: AiHandoffRequestedPayload
): Promise<void> {
  await emit('ai.handoff_requested', payload, ctx);
}

export async function dispatchAiStateChanged(
  ctx: DispatchContext,
  payload: AiStateChangedPayload
): Promise<void> {
  await emit('ai.state_changed', payload, ctx);
}

// ---------------------------------------------------------------------------
// Integration events
// ---------------------------------------------------------------------------

export async function dispatchIntegrationConnected(
  ctx: DispatchContext,
  payload: IntegrationConnectedPayload
): Promise<void> {
  await emit('integration.connected', payload, ctx);
}

export async function dispatchIntegrationSynced(
  ctx: DispatchContext,
  payload: IntegrationSyncedPayload
): Promise<void> {
  await emit('integration.synced', payload, ctx);
}

// ---------------------------------------------------------------------------
// Order events
// ---------------------------------------------------------------------------

export async function dispatchOrderCreated(
  ctx: DispatchContext,
  payload: OrderCreatedPayload
): Promise<void> {
  await emit('order.created', payload, ctx);
}

export async function dispatchOrderFulfilled(
  ctx: DispatchContext,
  payload: OrderFulfilledPayload
): Promise<void> {
  await emit('order.fulfilled', payload, ctx);
}

export async function dispatchInventoryUpdated(
  ctx: DispatchContext,
  payload: InventoryUpdatedPayload
): Promise<void> {
  await emit('inventory.updated', payload, ctx);
}

// ---------------------------------------------------------------------------
// Knowledge events
// ---------------------------------------------------------------------------

export async function dispatchKnowledgeIndexed(
  ctx: DispatchContext,
  payload: KnowledgeIndexedPayload
): Promise<void> {
  await emit('knowledge.indexed', payload, ctx);
}
