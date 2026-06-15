// Data Layer API barrel — the single import surface for all HTTP + types.
export {
  API_BASE_URL,
  fetchApi,
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getAdminToken,
  getClientToken,
  getAuthHeaders,
} from './client.js';
export type { ApiResponse, PaginatedResponse } from './client.js';
export { platformApi } from './platform.js';
export type {
  Customer,
  CustomerDetail,
  CustomerIdentifier,
  TimelineEvent,
  Conversation,
  ConversationStatus,
  ConversationPriority,
  ConversationMessage,
  SearchHit,
  MediaAsset,
  MediaKind,
  Segment,
  SegmentFilter,
  SegmentRule,
  SegmentPreview,
  CampaignStep,
  CampaignTrigger,
  DripEnrollment,
  StepActionType,
  StepActionConfig,
  TriggerEvent,
  Webhook,
  WebhookDelivery,
  AuditLogEntry,
  DeveloperLogEntry,
} from './platform.js';
// Re-exports for App.tsx — so the top-level shell can drop its services/api import.
export {
  authApi,
  adminApi,
  clientsApi,
  instancesApi,
  plansApi,
  paymentsApi,
} from '../../services/api.js';
export type {
  Instance,
  Client,
  Plan,
  ApiLog,
  AnalyticsData,
  TokenPackage,
  DailyUsage,
  TokenTransaction,
  ClientMessage,
} from '../../services/api.js';
