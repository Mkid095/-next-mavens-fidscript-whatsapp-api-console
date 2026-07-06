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

// ---- Phase 5 Slice E — Status posts (§15.6) ----
export type StatusPostKind = 'text' | 'image' | 'audio';
export type StatusPostState = 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'cancelled';

export interface StatusPost {
  id: string;
  workspace_id: string;
  instance_id: string;
  kind: StatusPostKind;
  content: string | null;
  media_id: string | null;
  caption: string | null;
  scheduled_at: string | null;
  posted_at: string | null;
  post_state: StatusPostState;
  cross_post_json: string | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateStatusPostInput {
  instance_id: string;
  kind: StatusPostKind;
  content?: string;
  media_id?: string;
  caption?: string;
  scheduled_at?: string | null;
  cross_post?: string[];
}

// ---- Webhooks (§14.1) ----
export interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'disabled';
  created_at: string;
  last_delivery_at: string | null;
}
export interface WebhookDelivery {
  id: string;
  event_type: string;
  response_code: number;
  attempt: number;
  delivered_at: string | null;
  error: string | null;
  created_at: string;
}
export interface AuditLogEntry {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before_json: string | null;
  after_json: string | null;
  ip_address: string | null;
  timestamp: string;
}
export interface DeveloperLogEntry {
  id: string;
  method: string;
  endpoint: string;
  response_status: number;
  latency_ms: number | null;
  ip_address: string | null;
  timestamp: string;
}

// ---- API functions ----
export const platformApi = {
  // Customers
  listCustomers: (q?: string) =>
    apiGet<Customer[]>(`/api/platform/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getCustomer: (id: string) => apiGet<CustomerDetail>(`/api/platform/customers/${id}`),
  getTimeline: (id: string) => apiGet<TimelineEvent[]>(`/api/platform/customers/${id}/timeline`),

  // Conversations
  listConversations: (filters?: { status?: ConversationStatus; priority?: ConversationPriority; assignee?: string; sla_at_risk?: boolean; q?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.assignee) params.set('assignee', filters.assignee);
    if (filters?.sla_at_risk) params.set('sla_at_risk', '1');
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

  // Status posts (Phase 5 Slice E §15.6) — /api/campaigns/statuses/*
  listStatusPosts: () => apiGet<StatusPost[]>(`/api/campaigns/statuses`),
  createStatusPost: (body: CreateStatusPostInput) =>
    apiPost<StatusPost>(`/api/campaigns/statuses`, body),
  updateStatusPost: (id: string, body: Partial<CreateStatusPostInput>) =>
    apiPatch<StatusPost>(`/api/campaigns/statuses/${id}`, body),
  deleteStatusPost: (id: string) => apiDelete<null>(`/api/campaigns/statuses/${id}`),
  scheduleStatusPost: (id: string, scheduled_at: string) =>
    apiPost<StatusPost>(`/api/campaigns/statuses/${id}/schedule`, { scheduled_at }),
  cancelStatusPost: (id: string) => apiPost<StatusPost>(`/api/campaigns/statuses/${id}/cancel`, {}),
  postStatusNow: (id: string) => apiPost<StatusPost>(`/api/campaigns/statuses/${id}/post`, {}),

  // Webhooks (§14.1) — /api/platform/webhooks
  listWebhooks: () => apiGet<Webhook[]>(`/api/platform/webhooks`),
  createWebhook: (body: { url: string; events: string[] }) =>
    apiPost<Webhook & { secret: string }>(`/api/platform/webhooks`, body),
  updateWebhook: (id: string, body: { url?: string; events?: string[]; status?: 'active' | 'disabled' }) =>
    apiPatch<null>(`/api/platform/webhooks/${id}`, body),
  deleteWebhook: (id: string) => apiDelete<null>(`/api/platform/webhooks/${id}`),
  listWebhookDeliveries: (id: string, limit = 50) =>
    apiGet<WebhookDelivery[]>(`/api/platform/webhooks/${id}/deliveries?limit=${limit}`),

  // Audit log (§6.4) — /api/platform/audit
  listAudit: (filters?: { resource?: string; actor?: string; since?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (filters?.resource) qs.set('resource', filters.resource);
    if (filters?.actor) qs.set('actor', filters.actor);
    if (filters?.since) qs.set('since', filters.since);
    if (filters?.limit) qs.set('limit', String(filters.limit));
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return apiGet<AuditLogEntry[]>(`/api/platform/audit${tail}`);
  },

  // Developer API logs (§14.2) — /api/platform/developer-logs
  listDeveloperLogs: (filters?: { method?: string; since?: string; minLatency?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (filters?.method) qs.set('method', filters.method);
    if (filters?.since) qs.set('since', filters.since);
    if (filters?.minLatency) qs.set('minLatency', String(filters.minLatency));
    if (filters?.limit) qs.set('limit', String(filters.limit));
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return apiGet<DeveloperLogEntry[]>(`/api/platform/developer-logs${tail}`);
  },
};

// =============================================================================
// Chatbot Platform API — /api/platform/chatbots/* and /api/platform/conversations/*
// Used by the ChatbotBuilder, ConversationInspector, and ChatbotListPage.
// =============================================================================

// ─── Shared sub-types ────────────────────────────────────────────────────────

export interface ChatbotTrigger {
  id: string; chatbot_id: string;
  trigger_type: 'keyword' | 'regex' | 'mention' | 'first_message' | 'always' | 'intent' | 'webhook';
  trigger_value: string; keyword_mode?: string; require_previous_bot_reply?: number;
  enabled: number; priority: number; created_at: string;
}
export interface ChatbotRule {
  id: string; chatbot_id: string; name: string; conditions_json: string;
  action: 'ai' | 'manual' | 'skip' | 'workflow'; action_config_json: string;
  priority: number; enabled: number; created_at: string;
}
export interface ChatbotHandoffRule {
  id: string; chatbot_id: string; name: string; conditions_json: string;
  target_team_id: string; target_team_name: string; priority: number; enabled: number; created_at: string;
}
export interface ChatbotGroupSetting {
  id: string; chatbot_id: string; group_jid: string; group_name?: string;
  respond_when_mentioned: number; respond_to_all: number; silence_on_bot_reply: number; created_at: string;
}
export interface ChatbotPublishJob {
  id: string; chatbot_id: string; workspace_id: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  progress: number; current_step: string; message: string;
  errors_json?: string; warnings_json?: string; created_at: string; updated_at: string;
}
export interface ChatbotVersion {
  id: string; chatbot_id: string; version: number; config_snapshot_json: string;
  prompt_version: number; created_at: string; created_by: string | null;
}
export interface ChatbotHealth {
  status: 'healthy' | 'disabled'; provider: string; model: string | null;
  knowledge: number; tools: number; triggers: number; last_test: string | null;
}
export interface ChatbotTokenForecast {
  currentMonth: { inputTokens: number; outputTokens: number; totalTokens: number; costCents: number };
  forecastMonth: { inputTokens: number; outputTokens: number; costCents: number };
  dailyAverage: { inputTokens: number; outputTokens: number };
  remainingDays: number; daysInMonth: number;
}
export interface ChatbotValidationResult {
  valid: boolean; errors: string[]; warnings: string[];
  checks: {
    provider: { ok: boolean; message: string };
    knowledge: { ok: boolean; message: string };
    tools: { ok: boolean; message: string };
  };
}
export interface ChatbotReplayResult {
  matchedTrigger: string | null; matchedRule: string | null;
  confidence: number; shouldRespond: boolean; skipReason: string | null;
}
export interface ChatbotTool {
  id: string; name: string; description: string | null; implementation: string;
  parameters_json: string; tool_enabled: number; attached_enabled: number;
  data_source_id: string; data_source_name: string;
}

// ─── Inspector types ────────────────────────────────────────────────────────

export interface InspectorConversation {
  conversationId: string; customerName: string; customerNumber: string;
  lastMessage: string; lastMessageAt: string; messageCount: number;
  unreadCount: number; lowConfidence: boolean; wasEscalated: boolean;
}
export interface InspectorMessage {
  id: string; fromNumber: string; fromName: string; messageType: string;
  content: string; mediaUrl: string | null; isRead: number; timestamp: string;
  direction: 'incoming' | 'outgoing' | 'system';
  customerId: string | null; conversationId: string;
  aiMetadata: InspectorAIMetadata | null;
}
export interface InspectorAIMetadata {
  confidence: number; model: string; promptVersion: string | null; botVersion: string | null;
  sources: InspectorSource[] | null; tools: InspectorTool[] | null;
  matchedTrigger: string | null; matchedRule: string | null; skipReason: string | null;
}
export interface InspectorSource { sourceName: string; sourceType: string; relevanceScore?: number }
export interface InspectorTool {
  toolId: string; toolName: string; resultSummary?: string;
  input?: unknown; output?: unknown; durationMs?: number;
}
export interface InspectorTrace {
  messageId: string; step: string; durationMs: number;
  metadata: Record<string, unknown> | null; createdAt: string;
}

// ─── Chatbot Platform API ──────────────────────────────────────────────────

export const chatbotPlatformApi = {

  // GET /api/platform/chatbots
  listChatbots: () => apiGet<Record<string, unknown>[]>(`/api/platform/chatbots`),

  // POST /api/platform/chatbots
  createChatbot: (body: { instance_id: string; name: string; description?: string; priority?: number; config_json?: string; enabled?: boolean }) =>
    apiPost<{ id: string }>(`/api/platform/chatbots`, body),

  // GET /api/platform/chatbots/:id
  getChatbot: (id: string) => apiGet<Record<string, unknown>>(`/api/platform/chatbots/${id}`),

  // PUT /api/platform/chatbots/:id
  updateChatbot: (id: string, body: Partial<{ name: string; description: string; priority: number; config_json: string; enabled: boolean; instance_id: string; }>) =>
    apiPut<null>(`/api/platform/chatbots/${id}`, body),

  // DELETE /api/platform/chatbots/:id
  deleteChatbot: (id: string) => apiDelete<null>(`/api/platform/chatbots/${id}`),

  // PATCH /api/platform/chatbots/:id/toggle
  toggleChatbot: (id: string, enabled: boolean) =>
    apiPatch<null>(`/api/platform/chatbots/${id}/toggle`, { enabled }),

  // PUT /api/platform/chatbots/:id/ai-config
  updateAiConfig: (id: string, body: Partial<{ model: string; provider: string; prompt: string; system_prompt: string; hallucination_policy: string; max_tokens: number; temperature: number; top_p: number; max_history_messages: number; llm_connection_id: string; }>) =>
    apiPut<null>(`/api/platform/chatbots/${id}/ai-config`, body),

  // POST /api/platform/chatbots/:id/triggers
  createTrigger: (id: string, body: { trigger_type: string; trigger_value?: string; keyword_mode?: string; require_previous_bot_reply?: boolean; enabled?: boolean; priority?: number; }) =>
    apiPost<{ id: string }>(`/api/platform/chatbots/${id}/triggers`, body),

  // DELETE /api/platform/chatbots/:id/triggers/:triggerId
  deleteTrigger: (id: string, triggerId: string) =>
    apiDelete<null>(`/api/platform/chatbots/${id}/triggers/${triggerId}`),

  // POST /api/platform/chatbots/:id/rules
  createRule: (id: string, body: { name?: string; conditions_json?: string; action: string; action_config_json?: string; priority?: number; enabled?: boolean; }) =>
    apiPost<{ id: string }>(`/api/platform/chatbots/${id}/rules`, body),

  // PUT /api/platform/chatbots/:id/rules/:ruleId
  updateRule: (id: string, ruleId: string, body: Partial<{ name: string; conditions_json: string; action: string; action_config_json: string; priority: number; enabled: boolean; }>) =>
    apiPut<null>(`/api/platform/chatbots/${id}/rules/${ruleId}`, body),

  // DELETE /api/platform/chatbots/:id/rules/:ruleId
  deleteRule: (id: string, ruleId: string) =>
    apiDelete<null>(`/api/platform/chatbots/${id}/rules/${ruleId}`),

  // POST /api/platform/chatbots/:id/handoff-rules
  createHandoffRule: (id: string, body: { name?: string; conditions_json?: string; target_team_id?: string; target_team_name?: string; priority?: number; enabled?: boolean; }) =>
    apiPost<{ id: string }>(`/api/platform/chatbots/${id}/handoff-rules`, body),

  // PUT /api/platform/chatbots/:id/policies
  updatePolicies: (id: string, body: Partial<{ confidence_threshold: number; escalate_on_low_confidence: boolean; requires_confirmation: boolean; max_retries: number; fallback_reply: string; }>) =>
    apiPut<null>(`/api/platform/chatbots/${id}/policies`, body),

  // POST /api/platform/chatbots/:id/group-settings
  setGroupSettings: (id: string, body: { group_jid: string; respond_when_mentioned?: boolean; respond_to_all?: boolean; silence_on_bot_reply?: boolean; }) =>
    apiPost<null>(`/api/platform/chatbots/${id}/group-settings`, body),

  // POST /api/platform/chatbots/:id/contacts/:contactId
  assignContact: (id: string, contactId: string) =>
    apiPost<null>(`/api/platform/chatbots/${id}/contacts/${contactId}`),

  // DELETE /api/platform/chatbots/:id/contacts/:contactId
  unassignContact: (id: string, contactId: string) =>
    apiDelete<null>(`/api/platform/chatbots/${id}/contacts/${contactId}`),

  // POST /api/platform/chatbots/:id/test-trigger
  testTrigger: (id: string, body: { message: string; contact_id?: string; conversation_id?: string }) =>
    apiPost<Record<string, unknown>>(`/api/platform/chatbots/${id}/test-trigger`, body),

  // POST /api/platform/chatbots/:id/publish
  publishChatbot: (id: string, draft_json: string) =>
    apiPost<{ jobId: string }>(`/api/platform/chatbots/${id}/publish`, { draft_json }),

  // GET /api/platform/chatbots/:id/publish-job
  getPublishJob: (id: string) => apiGet<ChatbotPublishJob>(`/api/platform/chatbots/${id}/publish-job`),

  // GET /api/platform/chatbots/:id/health
  getHealth: (id: string) => apiGet<ChatbotHealth>(`/api/platform/chatbots/${id}/health`),

  // POST /api/platform/chatbots/:id/test-config
  testConfig: (id: string, draft_json: string) =>
    apiPost<ChatbotValidationResult>(`/api/platform/chatbots/${id}/test-config`, { draft_json }),

  // GET /api/platform/chatbots/:id/versions
  listVersions: (id: string) => apiGet<ChatbotVersion[]>(`/api/platform/chatbots/${id}/versions`),

  // POST /api/platform/chatbots/:id/rollback
  rollback: (id: string, version_id: string) =>
    apiPost<null>(`/api/platform/chatbots/${id}/rollback`, { version_id }),

  // POST /api/platform/chatbots/:id/duplicate
  duplicateChatbot: (id: string) => apiPost<{ id: string }>(`/api/platform/chatbots/${id}/duplicate`, {}),

  // GET /api/platform/chatbots/:id/token-forecast
  getTokenForecast: (id: string) => apiGet<ChatbotTokenForecast>(`/api/platform/chatbots/${id}/token-forecast`),

  // GET /api/platform/chatbots/:id/traces
  getTraces: (id: string, params?: { conversationId?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.conversationId) qs.set('conversationId', params.conversationId);
    if (params?.limit) qs.set('limit', String(params.limit));
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return apiGet<Record<string, unknown>[]>(`/api/platform/chatbots/${id}/traces${tail}`);
  },

  // GET /api/platform/chatbots/:id/tools
  listTools: (id: string) => apiGet<ChatbotTool[]>(`/api/platform/chatbots/${id}/tools`),

  // POST /api/platform/chatbots/:id/tools
  attachTools: (id: string, tool_ids: string[]) =>
    apiPost<null>(`/api/platform/chatbots/${id}/tools`, { tool_ids }),

  // DELETE /api/platform/chatbots/:id/tools/:toolId
  detachTool: (id: string, toolId: string) =>
    apiDelete<null>(`/api/platform/chatbots/${id}/tools/${toolId}`),

  // ── Inspector endpoints ─────────────────────────────────────────────────

  // GET /api/platform/chatbots/:id/conversations
  listInspectorConversations: (id: string, params?: { q?: string; lowConfidence?: boolean; escalated?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.lowConfidence) qs.set('lowConfidence', '1');
    if (params?.escalated) qs.set('escalated', '1');
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return apiGet<InspectorConversation[]>(`/api/platform/chatbots/${id}/conversations${tail}`);
  },

  // POST /api/platform/chatbots/:id/replay
  replayMessage: (id: string, messageId: string) =>
    apiPost<ChatbotReplayResult>(`/api/platform/chatbots/${id}/replay`, { messageId }),

  // GET /api/platform/conversations/:id/messages
  getConversationMessages: (id: string) =>
    apiGet<InspectorMessage[]>(`/api/platform/conversations/${id}/messages`),

  // GET /api/platform/conversations/:id/traces
  getConversationTraces: (id: string) =>
    apiGet<InspectorTrace[]>(`/api/platform/conversations/${id}/traces`),
};

