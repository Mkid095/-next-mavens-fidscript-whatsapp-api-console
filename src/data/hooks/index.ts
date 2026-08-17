// Data Layer hooks barrel - components consume these, never the API directly (P7).
// Re-exports from sub-folders for backwards-compatible surface area.

export { useConversations } from './conversations/index.js';
export type { ConversationFilters } from './conversations/index.js';
export { useInbox } from './conversations/index.js';
export { useGroupInfo } from './conversations/index.js';
export type { GroupInfo } from './conversations/index.js';

export { useCustomers, useCustomer } from './customers/index.js';
export { useAssignment } from './customers/index.js';
export { useNotes } from './customers/index.js';
export { useTags } from './customers/index.js';
export { useTeams, useTeamMembers } from './customers/index.js';

export { useAgents, useAgentPermissions } from './agents/index.js';
export { useAIRules } from './agents/index.js';

export { useFlows, useFlow } from './automation/index.js';
export { useCampaignSteps, useCampaignTriggers, useDripEnrollments } from './automation/index.js';
export { useSLAPolicies } from './automation/index.js';

export { useWebhooks, useWebhookDeliveries, useAuditLog, useDeveloperLogs } from './developers/index.js';

export { useSegments, useSegmentPreview } from './segments/index.js';

export { useMediaAssets } from './media/index.js';

export { useStatusPosts } from './statuses/index.js';

export { useDataEvent, useDataEvents } from './shared/index.js';
export { useTimeline } from './shared/index.js';
export { useSearch } from './shared/index.js';
export { useAnalyticsOverview } from './shared/index.js';
