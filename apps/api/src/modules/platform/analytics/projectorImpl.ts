/**
 * Analytics projector impl - exports ALL_PROJECTORS constant.
 * @see projectorDefs.ts for individual projector definitions
 * @see projectorRegister.ts for registration
 * @see projector.ts for the barrel
 */

import {
  messageProjector,
  conversationProjector,
  slaProjector,
  campaignProjector,
  aiProjector,
  automationProjector,
  integrationProjector,
  type AnalyticsProjector,
} from './projectorDefs.js';

export type { AnalyticsProjector };

export const ALL_PROJECTORS: AnalyticsProjector[] = [
  messageProjector,
  conversationProjector,
  slaProjector,
  campaignProjector,
  aiProjector,
  automationProjector,
  integrationProjector,
];
