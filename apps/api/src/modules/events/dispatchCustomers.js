// Customer + campaign + automation dispatch handlers.
import { emit, type DispatchContext } from './dispatchCore.js';
import type {
  CustomerCreatedPayload, CustomerTaggedPayload, CustomerNotedPayload,
  CampaignStartedPayload, CampaignCompletedPayload, AutomationTriggeredPayload,
  FlowStartedPayload, FlowStepPayload, FlowCompletedPayload,
} from './catalog.js';

export async function dispatchCustomerCreated(ctx: DispatchContext, payload: CustomerCreatedPayload): Promise<void> {
  await emit('customer.created', payload, ctx);
}
export async function dispatchCustomerTagged(ctx: DispatchContext, payload: CustomerTaggedPayload): Promise<void> {
  await emit('customer.tagged', payload, ctx);
}
export async function dispatchCustomerNoted(ctx: DispatchContext, payload: CustomerNotedPayload): Promise<void> {
  await emit('customer.noted', payload, ctx);
}
export async function dispatchCampaignStarted(ctx: DispatchContext, payload: CampaignStartedPayload): Promise<void> {
  await emit('campaign.started', payload, ctx);
}
export async function dispatchCampaignCompleted(ctx: DispatchContext, payload: CampaignCompletedPayload): Promise<void> {
  await emit('campaign.completed', payload, ctx);
}
export async function dispatchAutomationTriggered(ctx: DispatchContext, payload: AutomationTriggeredPayload): Promise<void> {
  await emit('automation.triggered', payload, ctx);
}
export async function dispatchFlowStarted(ctx: DispatchContext, payload: FlowStartedPayload): Promise<void> {
  await emit('flow.started', payload, ctx);
}
export async function dispatchFlowStep(ctx: DispatchContext, payload: FlowStepPayload): Promise<void> {
  await emit('flow.step', payload, ctx);
}
export async function dispatchFlowCompleted(ctx: DispatchContext, payload: FlowCompletedPayload): Promise<void> {
  await emit('flow.completed', payload, ctx);
}
