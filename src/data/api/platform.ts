// =============================================================================
// Platform API functions — customer-centric reads + operational writes (§6–§13)
// Consumes /api/platform/* (client JWT, workspace-scoped).
// =============================================================================

import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from './client.js';

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

// ---- Phase 4 — AI + automation types ----
export interface Agent {
  id: string;
  name: string;
  description: string | null;
  model: string | null;
  default_action_set: string | null;
  enabled: boolean;
  created_at: string;
  permissions?: string[];
}

export interface AIRule {
  id: string;
  keyword: string;
  reply: string;
  confidence_threshold: number;
  escalate_on_low_confidence: number;
  set_ai_state: string | null;
  enabled: number;
  created_at: string;
}

export interface FlowSummary {
  id: string;
  name: string;
  trigger_event: string;
  enabled: number;
  version: number;
  created_at: string;
}

export interface FlowNodeInput { id?: string; type: 'trigger' | 'condition' | 'action' | 'wait' | 'branch' | 'ai'; config: Record<string, unknown>; }
export interface FlowEdgeInput { from: string; to: string; label?: string; }
export interface FlowDetail extends FlowSummary {
  workspace_id: string;
  nodes: Array<{ id: string; type: string; config: Record<string, unknown> }>;
  edges: Array<{ id: string; from: string; to: string; label?: string }>;
}
export interface FlowExecution {
  id: string;
  customer_id: string | null;
  conversation_id: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
}

// ---- Phase 5 Slice B — Media library types (§15.3) ----
export type MediaKind = 'image' | 'video' | 'audio' | 'document';

export interface MediaAsset {
  id: string;
  workspace_id: string;
  name: string;
  kind: MediaKind;
  mime: string;
  url: string;
  public_id: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
}

// ---- Phase 5 Slice C — Segments types (§15.2) ----
export type SegmentRule =
  | { field: 'tag'; op: 'has_any_of' | 'has_all_of' | 'has_none_of'; value: string[] }
  | { field: 'last_seen'; op: 'within_days' | 'before_days' | 'never'; value?: number }
  | { field: 'created'; op: 'within_days' | 'before_days'; value: number }
  | { field: 'name'; op: 'contains' | 'equals' | 'starts_with'; value: string }
  | { field: 'channel'; op: 'is'; value: 'whatsapp' | 'sms' | 'email' };

export interface SegmentFilter { logic: 'AND' | 'OR'; rules: SegmentRule[]; }

export interface Segment {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  filter: SegmentFilter;
  contact_count: number;
  last_computed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SegmentPreview {
  customer_count: number;
  phones: string[];
  sample_phones: string[];
  computed_at: string;
}

// ---- Phase 5 Slice D — Trigger + Drip types (§15.4-15.5) ----
export type StepActionType = 'send_text' | 'send_media' | 'add_tag' | 'set_status' | 'wait_branch';

export interface StepActionConfig {
  // send_text
  text?: string;
  // send_media
  media_url?: string;
  caption?: string;
  // both: which instance to use (defaults to first connected)
  instance_name?: string;
  // add_tag
  tag?: string;
  // set_status
  status?: 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed';
  // wait_branch
  delay_seconds?: number;
  condition?: 'tag_added' | 'replied' | 'opened';
}

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_order: number;
  delay_seconds: number;
  action_type: StepActionType;
  action_config: StepActionConfig;
}

export type TriggerEvent = 'customer.created' | 'customer.tagged' | 'conversation.created' | 'order.created';

export interface CampaignTrigger {
  id: string;
  campaign_id: string;
  event: TriggerEvent;
  filter_json: Record<string, unknown>;
  enabled: number;
  created_at: string;
}

export interface DripEnrollment {
  id: string;
  customer_id: string;
  campaign_id: string;
  current_step: number;
  enrolled_at: string;
  last_step_at: string | null;
  next_step_at: string | null;
  completed_at: string | null;
  state: 'active' | 'completed' | 'failed' | 'paused';
  customer_name: string | null;
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

  // Group metadata
  getGroupInfo: (chatId: string) =>
    apiGet<{ subject: string; size: number; owner: string | null }>(`/api/platform/groups/${encodeURIComponent(chatId)}/info`),

  // Tags (Phase 3 §6 / §9)
  listTags: (customerId: string) => apiGet<{ id: string; tag: string; created_at: string }[]>(`/api/platform/customers/${customerId}/tags`),
  addTag: (customerId: string, tag: string) => apiPost<{ id: string; tag: string }>(`/api/platform/customers/${customerId}/tags`, { tag }),
  removeTag: (customerId: string, tag: string) => apiDelete<null>(`/api/platform/customers/${customerId}/tags/${encodeURIComponent(tag)}`),

  // Notes (Phase 3 §6)
  listNotes: (customerId: string) =>
    apiGet<{ id: string; body: string; created_at: string; author_user_id: string | null; author_name: string | null }[]>(`/api/platform/customers/${customerId}/notes`),
  addNote: (customerId: string, body: string) => apiPost<{ id: string; body: string; created_at: string }>(`/api/platform/customers/${customerId}/notes`, { body }),
  removeNote: (customerId: string, noteId: string) => apiDelete<null>(`/api/platform/customers/${customerId}/notes/${noteId}`),

  // Customer assignment (§9 — long-term owner)
  getAssignment: (customerId: string) =>
    apiGet<{ id: string; owner_user_id: string | null; team_id: string | null; owner_name: string | null; team_name: string | null } | null>(`/api/platform/customers/${customerId}/assignment`),
  setAssignment: (customerId: string, body: { owner_user_id?: string | null; team_id?: string | null }) =>
    apiPut<null>(`/api/platform/customers/${customerId}/assignment`, body),

  // Teams (Phase 3 §4)
  listTeams: () => apiGet<{ id: string; name: string; created_at: string; member_count: number }[]>(`/api/platform/teams`),
  createTeam: (name: string) => apiPost<{ id: string; name: string }>(`/api/platform/teams`, { name }),
  renameTeam: (id: string, name: string) => apiPatch<null>(`/api/platform/teams/${id}`, { name }),
  deleteTeam: (id: string) => apiDelete<null>(`/api/platform/teams/${id}`),
  listTeamMembers: (id: string) =>
    apiGet<{ id: string; user_id: string; joined_at: string; email: string | null; name: string | null }[]>(`/api/platform/teams/${id}/members`),
  addTeamMember: (id: string, user_id: string) => apiPost<{ id: string }>(`/api/platform/teams/${id}/members`, { user_id }),
  removeTeamMember: (id: string, userId: string) => apiDelete<null>(`/api/platform/teams/${id}/members/${userId}`),

  // SLA policies (Phase 3 §9.2)
  listSLAPolicies: () =>
    apiGet<{ id: string; name: string; channel: string | null; priority: string | null; first_response_minutes: number; resolution_minutes: number; created_at: string }[]>(`/api/platform/sla-policies`),
  createSLAPolicy: (body: { name: string; channel?: string | null; priority?: string | null; first_response_minutes?: number; resolution_minutes?: number }) =>
    apiPost<{ id: string }>(`/api/platform/sla-policies`, body),
  updateSLAPolicy: (id: string, body: Partial<{ name: string; channel: string | null; priority: string | null; first_response_minutes: number; resolution_minutes: number }>) =>
    apiPatch<null>(`/api/platform/sla-policies/${id}`, body),
  deleteSLAPolicy: (id: string) => apiDelete<null>(`/api/platform/sla-policies/${id}`),

  // Agents (Phase 4 §10)
  listAgents: () =>
    apiGet<{ agents: Agent[]; action_catalog: string[] }>(`/api/platform/agents`),
  createAgent: (body: Partial<Agent> & { name: string }) =>
    apiPost<{ id: string }>(`/api/platform/agents`, body),
  updateAgent: (id: string, body: Partial<Agent>) => apiPatch<null>(`/api/platform/agents/${id}`, body),
  deleteAgent: (id: string) => apiDelete<null>(`/api/platform/agents/${id}`),
  getAgentPermissions: (id: string) =>
    apiGet<{ granted: string[]; catalog: string[] }>(`/api/platform/agents/${id}/permissions`),
  grantAgentPermission: (id: string, action: string) => apiPost<null>(`/api/platform/agents/${id}/permissions`, { action }),
  revokeAgentPermission: (id: string, action: string) => apiDelete<null>(`/api/platform/agents/${id}/permissions/${encodeURIComponent(action)}`),
  canAgent: (id: string, action: string) => apiPost<{ allowed: boolean }>(`/api/platform/agents/${id}/can`, { action }),
  handoff: (body: { conversation_id: string; state: 'ai_active' | 'ai_paused' | 'human_active' | 'escalated'; reason?: string }) =>
    apiPost<null>(`/api/platform/agents/handoff`, body),

  // AI keyword rules (Phase 4 §10.1 — simple rule form)
  listAIRules: () => apiGet<AIRule[]>(`/api/platform/automation-rules`),
  createAIRule: (body: { keyword: string; reply: string; confidence_threshold?: number; escalate_on_low_confidence?: boolean; set_ai_state?: string; enabled?: boolean }) =>
    apiPost<{ id: string }>(`/api/platform/automation-rules`, body),
  updateAIRule: (id: string, body: Partial<AIRule>) => apiPatch<null>(`/api/platform/automation-rules/${id}`, body),
  deleteAIRule: (id: string) => apiDelete<null>(`/api/platform/automation-rules/${id}`),

  // Flows (Phase 4 §11)
  listFlows: () => apiGet<FlowSummary[]>(`/api/platform/automations`),
  getFlow: (id: string) => apiGet<FlowDetail>(`/api/platform/automations/${id}`),
  createFlow: (body: { name: string; trigger_event?: string; nodes?: FlowNodeInput[]; edges?: FlowEdgeInput[] }) =>
    apiPost<{ id: string }>(`/api/platform/automations`, body),
  updateFlow: (id: string, body: { name?: string; trigger_event?: string; enabled?: boolean; nodes?: FlowNodeInput[]; edges?: FlowEdgeInput[] }) =>
    apiPatch<null>(`/api/platform/automations/${id}`, body),
  deleteFlow: (id: string) => apiDelete<null>(`/api/platform/automations/${id}`),
  listFlowExecutions: (id: string) => apiGet<FlowExecution[]>(`/api/platform/automations/${id}/executions`),

  // Media library (Phase 5 Slice B §15.3)
  listMedia: (filters?: { kind?: MediaKind; tag?: string; q?: string }) => {
    const params = new URLSearchParams();
    if (filters?.kind) params.set('kind', filters.kind);
    if (filters?.tag) params.set('tag', filters.tag);
    if (filters?.q) params.set('q', filters.q);
    const qs = params.toString();
    return apiGet<MediaAsset[]>(`/api/platform/media${qs ? `?${qs}` : ''}`);
  },
  createMedia: (body: { url?: string; image?: string; name?: string; mime?: string; tags?: string[] }) =>
    apiPost<MediaAsset>(`/api/platform/media`, body),
  updateMedia: (id: string, body: { name?: string; tags?: string[] }) =>
    apiPatch<null>(`/api/platform/media/${id}`, body),
  deleteMedia: (id: string) => apiDelete<null>(`/api/platform/media/${id}`),

  // Segments (Phase 5 Slice C §15.2)
  listSegments: () => apiGet<Segment[]>(`/api/platform/segments`),
  createSegment: (body: { name: string; description?: string; filter: SegmentFilter }) =>
    apiPost<Segment>(`/api/platform/segments`, body),
  updateSegment: (id: string, body: Partial<{ name: string; description: string; filter: SegmentFilter }>) =>
    apiPatch<null>(`/api/platform/segments/${id}`, body),
  deleteSegment: (id: string) => apiDelete<null>(`/api/platform/segments/${id}`),
  previewSegment: (id: string) => apiPost<SegmentPreview>(`/api/platform/segments/${id}/preview`, {}),
  previewAdhocSegment: (filter: SegmentFilter) =>
    apiPost<SegmentPreview>(`/api/platform/segments/preview-adhoc`, { filter }),
};
