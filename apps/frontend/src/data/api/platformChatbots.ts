/**
 * Platform API — chatbot core CRUD.
 * Inspector + advanced methods moved to platformChatbotsInspector.ts.
 */

import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from './client.js';

export const chatbotPlatformApi = {
  listChatbots: () => apiGet<Record<string, unknown>[]>(`/api/platform/chatbots`),

  createChatbot: (body: {
    instance_id: string; name: string; description?: string;
    priority?: number; config_json?: string; enabled?: boolean;
  }) => apiPost<{ id: string }>(`/api/platform/chatbots`, body),

  getChatbot: (id: string) =>
    apiGet<Record<string, unknown>>(`/api/platform/chatbots/${id}`),

  updateChatbot: (id: string, body: Partial<{
    name: string; description: string; priority: number;
    config_json: string; enabled: boolean; instance_id: string;
  }>) => apiPut<null>(`/api/platform/chatbots/${id}`, body),

  deleteChatbot: (id: string) =>
    apiDelete<null>(`/api/platform/chatbots/${id}`),

  toggleChatbot: (id: string, enabled: boolean) =>
    apiPatch<null>(`/api/platform/chatbots/${id}/toggle`, { enabled }),

  updateAiConfig: (id: string, body: Partial<{
    model: string; provider: string; prompt: string; system_prompt: string;
    hallucination_policy: string; max_tokens: number; temperature: number;
    top_p: number; max_history_messages: number; llm_connection_id: string;
  }>) => apiPut<null>(`/api/platform/chatbots/${id}/ai-config`, body),

  createTrigger: (id: string, body: {
    trigger_type: string; trigger_value?: string; keyword_mode?: string;
    require_previous_bot_reply?: boolean; enabled?: boolean; priority?: number;
  }) => apiPost<{ id: string }>(`/api/platform/chatbots/${id}/triggers`, body),

  deleteTrigger: (id: string, triggerId: string) =>
    apiDelete<null>(`/api/platform/chatbots/${id}/triggers/${triggerId}`),

  createRule: (id: string, body: {
    name?: string; conditions_json?: string; action: string;
    action_config_json?: string; priority?: number; enabled?: boolean;
  }) => apiPost<{ id: string }>(`/api/platform/chatbots/${id}/rules`, body),

  updateRule: (id: string, ruleId: string, body: Partial<{
    name: string; conditions_json: string; action: string;
    action_config_json: string; priority: number; enabled: boolean;
  }>) => apiPut<null>(`/api/platform/chatbots/${id}/rules/${ruleId}`),

  deleteRule: (id: string, ruleId: string) =>
    apiDelete<null>(`/api/platform/chatbots/${id}/rules/${ruleId}`),

  createHandoffRule: (id: string, body: {
    name?: string; conditions_json?: string; target_team_id?: string;
    target_team_name?: string; priority?: number; enabled?: boolean;
  }) => apiPost<{ id: string }>(`/api/platform/chatbots/${id}/handoff-rules`, body),

  updatePolicies: (id: string, body: Partial<{
    confidence_threshold: number; escalate_on_low_confidence: boolean;
    requires_confirmation: boolean; max_retries: number; fallback_reply: string;
  }>) => apiPut<null>(`/api/platform/chatbots/${id}/policies`, body),

  setGroupSettings: (id: string, body: {
    group_jid: string; respond_when_mentioned?: boolean;
    respond_to_all?: boolean; silence_on_bot_reply?: boolean;
  }) => apiPost<null>(`/api/platform/chatbots/${id}/group-settings`, body),

  assignContact: (id: string, contactId: string) =>
    apiPost<null>(`/api/platform/chatbots/${id}/contacts/${contactId}`),

  unassignContact: (id: string, contactId: string) =>
    apiDelete<null>(`/api/platform/chatbots/${id}/contacts/${contactId}`),

  testTrigger: (id: string, body: {
    message: string; contact_id?: string; conversation_id?: string;
  }) => apiPost<Record<string, unknown>>(`/api/platform/chatbots/${id}/test-trigger`, body),

  duplicateChatbot: (id: string) =>
    apiPost<{ id: string }>(`/api/platform/chatbots/${id}/duplicate`, {}),
};
