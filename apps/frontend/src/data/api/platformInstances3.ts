/**
 * Platform API — webhooks, audit logs, developer logs, teams, SLA policies.
 * Extracted from platformInstances.ts to keep files under 150 lines.
 */

import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from './client.js';

export interface Webhook {
  id: string; url: string; events: string[];
  status: 'active' | 'disabled'; created_at: string; last_delivery_at: string | null;
}
export interface WebhookDelivery {
  id: string; event_type: string; response_code: number;
  attempt: number; delivered_at: string | null; error: string | null; created_at: string;
}
export interface AuditLogEntry {
  id: string; actor_user_id: string | null; action: string;
  entity_type: string; entity_id: string;
  before_json: string | null; after_json: string | null;
  ip_address: string | null; timestamp: string;
}
export interface DeveloperLogEntry {
  id: string; method: string; endpoint: string;
  response_status: number; latency_ms: number | null; ip_address: string | null; timestamp: string;
}

// ─── Webhooks (§14.1) ─────────────────────────────────────────────────────────

export const platformWebhooksApi = {
  listWebhooks: () => apiGet<Webhook[]>(`/api/platform/webhooks`),
  createWebhook: (body: { url: string; events: string[] }) =>
    apiPost<Webhook & { secret: string }>(`/api/platform/webhooks`, body),
  updateWebhook: (
    id: string,
    body: { url?: string; events?: string[]; status?: 'active' | 'disabled' },
  ) => apiPatch<null>(`/api/platform/webhooks/${id}`, body),
  deleteWebhook: (id: string) => apiDelete<null>(`/api/platform/webhooks/${id}`),
  listWebhookDeliveries: (id: string, limit = 50) =>
    apiGet<WebhookDelivery[]>(`/api/platform/webhooks/${id}/deliveries?limit=${limit}`),
};

// ─── Audit + developer logs ───────────────────────────────────────────────────

export const platformLogsApi = {
  listAudit: (filters?: {
    resource?: string; actor?: string; since?: string; limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (filters?.resource) qs.set('resource', filters.resource);
    if (filters?.actor) qs.set('actor', filters.actor);
    if (filters?.since) qs.set('since', filters.since);
    if (filters?.limit) qs.set('limit', String(filters.limit));
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return apiGet<AuditLogEntry[]>(`/api/platform/audit${tail}`);
  },
  listDeveloperLogs: (filters?: {
    method?: string; since?: string; minLatency?: number; limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (filters?.method) qs.set('method', filters.method);
    if (filters?.since) qs.set('since', filters.since);
    if (filters?.minLatency) qs.set('minLatency', String(filters.minLatency));
    if (filters?.limit) qs.set('limit', String(filters.limit));
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return apiGet<DeveloperLogEntry[]>(`/api/platform/developer-logs${tail}`);
  },
};

// ─── Teams (Phase 3 §4) ─────────────────────────────────────────────────────

export const platformTeamsApi = {
  listTeams: () =>
    apiGet<{ id: string; name: string; created_at: string; member_count: number }[]>(`/api/platform/teams`),
  createTeam: (name: string) =>
    apiPost<{ id: string; name: string }>(`/api/platform/teams`, { name }),
  renameTeam: (id: string, name: string) =>
    apiPatch<null>(`/api/platform/teams/${id}`, { name }),
  deleteTeam: (id: string) => apiDelete<null>(`/api/platform/teams/${id}`),
  listTeamMembers: (id: string) =>
    apiGet<{
      id: string; user_id: string; joined_at: string;
      email: string | null; name: string | null;
    }[]>(`/api/platform/teams/${id}/members`),
  addTeamMember: (id: string, user_id: string) =>
    apiPost<{ id: string }>(`/api/platform/teams/${id}/members`, { user_id }),
  removeTeamMember: (id: string, userId: string) =>
    apiDelete<null>(`/api/platform/teams/${id}/members/${userId}`),
};

// ─── SLA policies (Phase 3 §9.2) ─────────────────────────────────────────────

export const platformSLAPoliciesApi = {
  listSLAPolicies: () =>
    apiGet<{
      id: string; name: string; channel: string | null; priority: string | null;
      first_response_minutes: number; resolution_minutes: number; created_at: string;
    }[]>(`/api/platform/sla-policies`),
  createSLAPolicy: (body: {
    name: string; channel?: string | null; priority?: string | null;
    first_response_minutes?: number; resolution_minutes?: number;
  }) => apiPost<{ id: string }>(`/api/platform/sla-policies`, body),
  updateSLAPolicy: (
    id: string,
    body: Partial<{
      name: string; channel: string | null; priority: string | null;
      first_response_minutes: number; resolution_minutes: number;
    }>,
  ) => apiPatch<null>(`/api/platform/sla-policies/${id}`, body),
  deleteSLAPolicy: (id: string) => apiDelete<null>(`/api/platform/sla-policies/${id}`),
};
