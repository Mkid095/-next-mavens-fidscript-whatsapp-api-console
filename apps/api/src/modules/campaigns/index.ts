// Campaigns module barrel
// Event helpers + dispatch (delivery mechanics) live here.
// Campaign entity types live in kernel/campaigns/.

import {
  dispatchCampaignStarted,
  dispatchCampaignCompleted,
  type DispatchContext,
} from '../platform/events/index.js';
import type {
  CampaignStartedPayload,
  CampaignCompletedPayload,
} from '../platform/events/index.js';

// Campaign entity types — canonical source
export type {
  Campaign,
  CampaignRecipient,
  CampaignTrigger,
  CampaignStep,
  CampaignStatus,
  CampaignType,
} from '../../kernel/campaigns/index.js';

// =============================================================================
// Campaign event helpers
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
