// AI + integration + order + knowledge dispatch handlers.
import { emit, type DispatchContext } from './dispatchCore.js';
import type {
  AiReplyGeneratedPayload, AiHandoffRequestedPayload, AiStateChangedPayload,
  IntegrationConnectedPayload, IntegrationSyncedPayload, OrderCreatedPayload,
  OrderFulfilledPayload, InventoryUpdatedPayload, KnowledgeIndexedPayload,
} from './catalog.js';

export async function dispatchAiReplyGenerated(ctx: DispatchContext, payload: AiReplyGeneratedPayload): Promise<void> {
  await emit('ai.reply.generated', payload, ctx);
}
export async function dispatchAiHandoffRequested(ctx: DispatchContext, payload: AiHandoffRequestedPayload): Promise<void> {
  await emit('ai.handoff_requested', payload, ctx);
}
export async function dispatchAiStateChanged(ctx: DispatchContext, payload: AiStateChangedPayload): Promise<void> {
  await emit('ai.state_changed', payload, ctx);
}
export async function dispatchIntegrationConnected(ctx: DispatchContext, payload: IntegrationConnectedPayload): Promise<void> {
  await emit('integration.connected', payload, ctx);
}
export async function dispatchIntegrationSynced(ctx: DispatchContext, payload: IntegrationSyncedPayload): Promise<void> {
  await emit('integration.synced', payload, ctx);
}
export async function dispatchOrderCreated(ctx: DispatchContext, payload: OrderCreatedPayload): Promise<void> {
  await emit('order.created', payload, ctx);
}
export async function dispatchOrderFulfilled(ctx: DispatchContext, payload: OrderFulfilledPayload): Promise<void> {
  await emit('order.fulfilled', payload, ctx);
}
export async function dispatchInventoryUpdated(ctx: DispatchContext, payload: InventoryUpdatedPayload): Promise<void> {
  await emit('inventory.updated', payload, ctx);
}
export async function dispatchKnowledgeIndexed(ctx: DispatchContext, payload: KnowledgeIndexedPayload): Promise<void> {
  await emit('knowledge.indexed', payload, ctx);
}
