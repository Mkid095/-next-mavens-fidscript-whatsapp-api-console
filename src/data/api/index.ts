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
} from './platform.js';
