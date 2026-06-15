// =============================================================================
// Data Layer — public barrel (§16, P7)
// Components import hooks/types/providers from here; they never call the API
// transport directly. Existing src/services/* re-exports from ./api for compat.
// =============================================================================

// API transport + types
export {
  API_BASE_URL,
  fetchApi,
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getAuthHeaders,
} from './api/index.js';
export type { ApiResponse, PaginatedResponse } from './api/index.js';
export { platformApi } from './api/index.js';
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
} from './api/index.js';

// Realtime event bus
export { dataEvents, emitDataEvent } from './events.js';
export type { PlatformEventType, PlatformEvent } from './events.js';

// Providers
export { AppProviders, useAppData } from './providers/index.js';

// Hooks
export {
  useDataEvent,
  useDataEvents,
  useCustomers,
  useCustomer,
  useConversations,
  useTimeline,
  useSearch,
  useAnalyticsOverview,
  useInbox,
} from './hooks/index.js';
export type { ConversationFilters } from './hooks/index.js';
