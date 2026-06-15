import {
  dispatchCampaignStarted,
  dispatchCampaignCompleted,
  type DispatchContext,
} from '../platform/events/dispatch.js';
import type {
  CampaignStartedPayload,
  CampaignCompletedPayload,
} from '../platform/events/catalog.js';

// =============================================================================
// Campaign event helpers — thin wrappers so routes don't import dispatch.ts
// directly. Keeps the bus-typing surface small.
// =============================================================================

export async function emitCampaignStarted(
  ctx: DispatchContext,
  payload: CampaignStartedPayload
): Promise<void> {
  await dispatchCampaignStarted(ctx, payload);
}

export async function emitCampaignCompleted(
  ctx: DispatchContext,
  payload: CampaignCompletedPayload
): Promise<void> {
  await dispatchCampaignCompleted(ctx, payload);
}

export { dispatchCampaignMessage, campaignNormalizePhone, idempotencyKeyFor, campaignEventMeta } from './dispatch.js';
export type { CampaignMessageKind, CampaignSendArgs, CampaignSendResult } from './dispatch.js';
