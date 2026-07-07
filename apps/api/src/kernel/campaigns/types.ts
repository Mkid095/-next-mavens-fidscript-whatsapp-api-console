/**
 * Campaign entity types — the canonical "what" of a campaign.
 * Delivery mechanics (dispatch, drip, scheduling) live in modules/campaigns/.
 */

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
export type CampaignType = 'broadcast' | 'drip' | 'triggered';

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  /** Total recipients at launch time (snapshot, not live) */
  totalRecipients: number;
  /** Aggregated counts — updated by campaign_completed event */
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  customerId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  error?: string;
  enrolledAt: string;
  sentAt?: string;
  deliveredAt?: string;
}

export interface CampaignTrigger {
  id: string;
  campaignId: string;
  event: string; // e.g. 'customer.created', 'customer.tagged'
  filterJson: string;
  enabled: boolean;
}

export interface CampaignStep {
  id: string;
  campaignId: string;
  stepOrder: number;
  delaySeconds: number;
  actionType: 'send_text' | 'send_media' | 'add_tag' | 'set_status' | 'wait_branch';
  actionConfig: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Bus event payloads (defined here for convenience, actual emission uses kernel/events/catalog)
// ---------------------------------------------------------------------------

export interface CampaignStartedPayload {
  campaignId: string;
  stats: { totalRecipients: number };
}

export interface CampaignCompletedPayload {
  campaignId: string;
  stats: { sent: number; delivered: number; failed: number };
}
