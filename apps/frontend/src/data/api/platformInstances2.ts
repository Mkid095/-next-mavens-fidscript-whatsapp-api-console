/**
 * Platform API — flows, media, segments, status posts.
 * Agents + AI rules moved to platformAgents.ts.
 */

import { apiGet, apiPatch, apiPost, apiDelete } from './client.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlowSummary {
  id: string; name: string; trigger_event: string;
  enabled: number; version: number; created_at: string;
}
export interface FlowNodeInput {
  id?: string; type: 'trigger' | 'condition' | 'action' | 'wait' | 'branch' | 'ai';
  config: Record<string, unknown>;
}
export interface FlowEdgeInput { from: string; to: string; label?: string; }
export interface FlowDetail extends FlowSummary {
  workspace_id: string;
  nodes: Array<{ id: string; type: string; config: Record<string, unknown> }>;
  edges: Array<{ id: string; from: string; to: string; label?: string }>;
}
export interface FlowExecution {
  id: string; customer_id: string | null; conversation_id: string | null;
  status: string; started_at: string; completed_at: string | null;
}
export type MediaKind = 'image' | 'video' | 'audio' | 'document';
export interface MediaAsset {
  id: string; workspace_id: string; name: string; kind: MediaKind; mime: string;
  url: string; public_id: string | null; size_bytes: number | null;
  width: number | null; height: number | null; tags: string[];
  created_by: string | null; created_at: string;
}
export type SegmentRule =
  | { field: 'tag'; op: 'has_any_of' | 'has_all_of' | 'has_none_of'; value: string[] }
  | { field: 'last_seen'; op: 'within_days' | 'before_days' | 'never'; value?: number }
  | { field: 'created'; op: 'within_days' | 'before_days'; value: number }
  | { field: 'name'; op: 'contains' | 'equals' | 'starts_with'; value: string }
  | { field: 'channel'; op: 'is'; value: 'whatsapp' | 'sms' | 'email' };
export interface SegmentFilter { logic: 'AND' | 'OR'; rules: SegmentRule[]; }
export interface Segment {
  id: string; workspace_id: string; name: string; description: string | null;
  filter: SegmentFilter; contact_count: number;
  last_computed_at: string | null; created_at: string; updated_at: string;
}
export interface SegmentPreview {
  customer_count: number; phones: string[]; sample_phones: string[]; computed_at: string;
}
export type StatusPostKind = 'text' | 'image' | 'audio';
export type StatusPostState = 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'cancelled';
export interface StatusPost {
  id: string; workspace_id: string; instance_id: string; kind: StatusPostKind;
  content: string | null; media_id: string | null; caption: string | null;
  scheduled_at: string | null; posted_at: string | null; post_state: StatusPostState;
  cross_post_json: string | null; error_message: string | null;
  created_by: string | null; created_at: string;
}
export interface CreateStatusPostInput {
  instance_id: string; kind: StatusPostKind;
  content?: string; media_id?: string; caption?: string;
  scheduled_at?: string | null; cross_post?: string[];
}

// ─── Flows (Phase 4 §11) ─────────────────────────────────────────────────────

export const platformFlowsApi = {
  listFlows: () => apiGet<FlowSummary[]>(`/api/platform/automations`),
  getFlow: (id: string) => apiGet<FlowDetail>(`/api/platform/automations/${id}`),
  createFlow: (body: {
    name: string; trigger_event?: string;
    nodes?: FlowNodeInput[]; edges?: FlowEdgeInput[];
  }) => apiPost<{ id: string }>(`/api/platform/automations`, body),
  updateFlow: (id: string, body: {
    name?: string; trigger_event?: string; enabled?: boolean;
    nodes?: FlowNodeInput[]; edges?: FlowEdgeInput[];
  }) => apiPatch<null>(`/api/platform/automations/${id}`, body),
  deleteFlow: (id: string) => apiDelete<null>(`/api/platform/automations/${id}`),
  listFlowExecutions: (id: string) =>
    apiGet<FlowExecution[]>(`/api/platform/automations/${id}/executions`),
};

// ─── Media library (Phase 5 Slice B §15.3) ───────────────────────────────────

export const platformMediaApi = {
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
};

// ─── Segments (Phase 5 Slice C §15.2) ───────────────────────────────────────

export const platformSegmentsApi = {
  listSegments: () => apiGet<Segment[]>(`/api/platform/segments`),
  createSegment: (body: { name: string; description?: string; filter: SegmentFilter }) =>
    apiPost<Segment>(`/api/platform/segments`, body),
  updateSegment: (id: string, body: Partial<{ name: string; description: string; filter: SegmentFilter }>) =>
    apiPatch<null>(`/api/platform/segments/${id}`, body),
  deleteSegment: (id: string) => apiDelete<null>(`/api/platform/segments/${id}`),
  previewSegment: (id: string) =>
    apiPost<SegmentPreview>(`/api/platform/segments/${id}/preview`, {}),
  previewAdhocSegment: (filter: SegmentFilter) =>
    apiPost<SegmentPreview>(`/api/platform/segments/preview-adhoc`, { filter }),
};

// ─── Status posts (Phase 5 Slice E §15.6) ────────────────────────────────────

export const platformStatusPostsApi = {
  listStatusPosts: () => apiGet<StatusPost[]>(`/api/campaigns/statuses`),
  createStatusPost: (body: CreateStatusPostInput) =>
    apiPost<StatusPost>(`/api/campaigns/statuses`, body),
  updateStatusPost: (id: string, body: Partial<CreateStatusPostInput>) =>
    apiPatch<StatusPost>(`/api/campaigns/statuses/${id}`, body),
  deleteStatusPost: (id: string) => apiDelete<null>(`/api/campaigns/statuses/${id}`),
  scheduleStatusPost: (id: string, scheduled_at: string) =>
    apiPost<StatusPost>(`/api/campaigns/statuses/${id}/schedule`, { scheduled_at }),
  cancelStatusPost: (id: string) =>
    apiPost<StatusPost>(`/api/campaigns/statuses/${id}/cancel`, {}),
  postStatusNow: (id: string) =>
    apiPost<StatusPost>(`/api/campaigns/statuses/${id}/post`, {}),
};
