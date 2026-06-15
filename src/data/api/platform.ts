// =============================================================================
// Platform API functions — customer-centric reads + operational writes (§6–§13)
// Consumes /api/platform/* (client JWT, workspace-scoped).
// =============================================================================

import { apiGet, apiPatch } from './client.js';

// ---- Types (mirror backend rows) ----
export interface Customer {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  primary_identifier?: string | null;
  channel?: string | null;
  created_at: string;
  last_seen_at: string | null;
}

export interface CustomerIdentifier { id: string; channel: string; value: string; label: string | null; }

export interface CustomerDetail extends Customer {
  identifiers: CustomerIdentifier[];
  tags: { tag: string; created_at: string }[];
}

export interface TimelineEvent {
  id: string;
  type: string;
  entity_type: string;
  entity_id: string;
  conversation_id: string | null;
  actor_user_id: string | null;
  payload: string;
  created_at: string;
}

export type ConversationStatus = 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed';
export type ConversationPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Conversation {
  id: string;
  customer_id: string;
  channel: string;
  instance_id: string | null;
  chat_id: string;
  status: ConversationStatus;
  priority: ConversationPriority;
  assignee_type: 'user' | 'team' | 'unassigned';
  assignee_id: string | null;
  unread_count: number;
  last_message_at: string | null;
  ai_state: string;
  created_at: string;
  customer_name: string | null;
  last_message: string | null;
  last_message_type: string | null;
}

export interface SearchHit {
  entityType: string;
  entityId: string;
  body: string;
  tags: string[];
  workspaceId: string;
}

export interface ConversationMessage {
  id: string;
  from_number: string;
  from_name: string;
  message_type: string;
  content: string;
  media_url: string | null;
  is_read: number;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  customer_id: string | null;
}

// ---- API functions ----
export const platformApi = {
  // Customers
  listCustomers: (q?: string) =>
    apiGet<Customer[]>(`/api/platform/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getCustomer: (id: string) => apiGet<CustomerDetail>(`/api/platform/customers/${id}`),
  getTimeline: (id: string) => apiGet<TimelineEvent[]>(`/api/platform/customers/${id}/timeline`),

  // Conversations
  listConversations: (filters?: { status?: ConversationStatus; priority?: ConversationPriority; assignee?: string; q?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.assignee) params.set('assignee', filters.assignee);
    if (filters?.q) params.set('q', filters.q);
    const qs = params.toString();
    return apiGet<Conversation[]>(`/api/platform/conversations${qs ? `?${qs}` : ''}`);
  },
  getConversationMessages: (id: string) => apiGet<ConversationMessage[]>(`/api/platform/conversations/${id}/messages`),
  updateConversation: (id: string, body: Partial<{ status: ConversationStatus; priority: ConversationPriority; assignee_type: 'user' | 'team' | 'unassigned'; assignee_id: string | null }>) =>
    apiPatch<null>(`/api/platform/conversations/${id}`, body),

  // Search + analytics
  search: (q: string, types?: string[]) => {
    const params = new URLSearchParams({ q });
    if (types?.length) params.set('types', types.join(','));
    return apiGet<SearchHit[]>(`/api/platform/search?${params.toString()}`);
  },
  analyticsOverview: () => apiGet<Record<string, number>>(`/api/platform/analytics/overview`),
};
