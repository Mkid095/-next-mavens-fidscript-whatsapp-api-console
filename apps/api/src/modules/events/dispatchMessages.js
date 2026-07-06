// Message + conversation + SLA dispatch handlers.
import { emit, type DispatchContext } from './dispatchCore.js';
import type {
  MessageReceivedPayload, MessageSentPayload, MessageDeliveredPayload,
  MessageReadPayload, MessageFailedPayload, ConversationCreatedPayload,
  ConversationAssignedPayload, ConversationPriorityChangedPayload,
  ConversationStatusChangedPayload, SlaResponseDuePayload, SlaBreachedPayload,
} from './catalog.js';

export async function dispatchMessageReceived(
  ctx: DispatchContext,
  payload: Omit<MessageReceivedPayload, 'conversationId' | 'customerId'> & { conversationId: string; customerId: string; }
): Promise<void> {
  await emit('message.received', payload as MessageReceivedPayload, ctx);
}
export async function dispatchMessageSent(
  ctx: DispatchContext,
  payload: Omit<MessageSentPayload, 'conversationId' | 'customerId'> & { conversationId: string; customerId: string; }
): Promise<void> {
  await emit('message.sent', payload as MessageSentPayload, ctx);
}
export async function dispatchMessageDelivered(ctx: DispatchContext, payload: MessageDeliveredPayload): Promise<void> {
  await emit('message.delivered', payload, ctx);
}
export async function dispatchMessageRead(ctx: DispatchContext, payload: MessageReadPayload): Promise<void> {
  await emit('message.read', payload, ctx);
}
export async function dispatchMessageFailed(ctx: DispatchContext, payload: MessageFailedPayload): Promise<void> {
  await emit('message.failed', payload, ctx);
}
export async function dispatchConversationCreated(ctx: DispatchContext, payload: ConversationCreatedPayload): Promise<void> {
  await emit('conversation.created', payload, ctx);
}
export async function dispatchConversationAssigned(ctx: DispatchContext, payload: ConversationAssignedPayload): Promise<void> {
  await emit('conversation.assigned', payload, ctx);
}
export async function dispatchConversationPriorityChanged(ctx: DispatchContext, payload: ConversationPriorityChangedPayload): Promise<void> {
  await emit('conversation.priority_changed', payload, ctx);
}
export async function dispatchConversationStatusChanged(ctx: DispatchContext, payload: ConversationStatusChangedPayload): Promise<void> {
  await emit('conversation.status_changed', payload, ctx);
}
export async function dispatchSlaResponseDue(ctx: DispatchContext, payload: SlaResponseDuePayload): Promise<void> {
  await emit('sla.response_due', payload, ctx);
}
export async function dispatchSlaBreached(ctx: DispatchContext, payload: SlaBreachedPayload): Promise<void> {
  await emit('sla.breached', payload, ctx);
}
