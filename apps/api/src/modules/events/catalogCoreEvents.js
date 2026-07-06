// Event catalog — customer + campaign + automation interfaces.
export interface CustomerCreatedPayload { customerId: string; channel: string; identifier: string; displayName?: string | null; }
export interface CustomerTaggedPayload { customerId: string; tag: string; byUserId?: string; }
export interface CustomerNotedPayload { customerId: string; noteId: string; byUserId: string; }
export interface CampaignStartedPayload { campaignId: string; stats: { totalRecipients: number }; }
export interface CampaignCompletedPayload { campaignId: string; stats: { sent: number; delivered: number; failed: number }; }
export interface AutomationTriggeredPayload { flowId: string; triggerEvent: string; conversationId?: string; customerId?: string; }
export interface FlowStartedPayload { flowId: string; executionId: string; customerId?: string; conversationId?: string; }
export interface FlowStepPayload { flowId: string; executionId: string; nodeId: string; }
export interface FlowCompletedPayload { flowId: string; executionId: string; }
