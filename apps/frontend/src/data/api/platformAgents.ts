/**
 * Platform API — agents and AI rules.
 * Extracted from platformInstances2.ts to keep files under 150 lines.
 */

import { apiGet, apiPatch, apiPost, apiDelete } from './client.js';

export interface Agent {
  id: string; name: string; description: string | null;
  model: string | null; default_action_set: string | null;
  enabled: boolean; created_at: string; permissions?: string[];
}
export interface AIRule {
  id: string; keyword: string; reply: string;
  confidence_threshold: number; escalate_on_low_confidence: number;
  set_ai_state: string | null; enabled: number; created_at: string;
}

export const platformAgentsApi = {
  listAgents: () =>
    apiGet<{ agents: Agent[]; action_catalog: string[] }>(`/api/platform/agents`),
  createAgent: (body: Partial<Agent> & { name: string }) =>
    apiPost<{ id: string }>(`/api/platform/agents`, body),
  updateAgent: (id: string, body: Partial<Agent>) =>
    apiPatch<null>(`/api/platform/agents/${id}`, body),
  deleteAgent: (id: string) => apiDelete<null>(`/api/platform/agents/${id}`),
  getAgentPermissions: (id: string) =>
    apiGet<{ granted: string[]; catalog: string[] }>(`/api/platform/agents/${id}/permissions`),
  grantAgentPermission: (id: string, action: string) =>
    apiPost<null>(`/api/platform/agents/${id}/permissions`, { action }),
  revokeAgentPermission: (id: string, action: string) =>
    apiDelete<null>(`/api/platform/agents/${id}/permissions/${encodeURIComponent(action)}`),
  canAgent: (id: string, action: string) =>
    apiPost<{ allowed: boolean }>(`/api/platform/agents/${id}/can`, { action }),
  handoff: (body: {
    conversation_id: string;
    state: 'ai_active' | 'ai_paused' | 'human_active' | 'escalated';
    reason?: string;
  }) => apiPost<null>(`/api/platform/agents/handoff`, body),
};

export const platformAIRulesApi = {
  listAIRules: () => apiGet<AIRule[]>(`/api/platform/automation-rules`),
  createAIRule: (body: {
    keyword: string; reply: string; confidence_threshold?: number;
    escalate_on_low_confidence?: boolean; set_ai_state?: string; enabled?: boolean;
  }) => apiPost<{ id: string }>(`/api/platform/automation-rules`, body),
  updateAIRule: (id: string, body: Partial<AIRule>) =>
    apiPatch<null>(`/api/platform/automation-rules/${id}`, body),
  deleteAIRule: (id: string) => apiDelete<null>(`/api/platform/automation-rules/${id}`),
};
