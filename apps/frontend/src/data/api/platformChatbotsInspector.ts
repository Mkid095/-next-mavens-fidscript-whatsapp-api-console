/**
 * Platform API — chatbot inspector endpoints.
 * Extracted from platformChatbots.ts to keep files under 150 lines.
 */

import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from './client.js';

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

export interface ChatbotPublishJob {
  id: string; chatbot_id: string; workspace_id: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  progress: number; current_step: string; message: string;
  errors_json?: string; warnings_json?: string; created_at: string; updated_at: string;
}
export interface ChatbotHealth {
  status: 'healthy' | 'disabled'; provider: string; model: string | null;
  knowledge: number; tools: number; triggers: number; last_test: string | null;
}
export interface ChatbotValidationResult {
  valid: boolean; errors: string[]; warnings: string[];
  checks: {
    provider: { ok: boolean; message: string };
    knowledge: { ok: boolean; message: string };
    tools: { ok: boolean; message: string };
  };
}
export interface ChatbotVersion {
  id: string; chatbot_id: string; version: number; config_snapshot_json: string;
  prompt_version: number; created_at: string; created_by: string | null;
}
export interface ChatbotTokenForecast {
  currentMonth: { inputTokens: number; outputTokens: number; totalTokens: number; costCents: number };
  forecastMonth: { inputTokens: number; outputTokens: number; costCents: number };
  dailyAverage: { inputTokens: number; outputTokens: number };
  remainingDays: number; daysInMonth: number;
}
export interface ChatbotTool {
  id: string; name: string; description: string | null; implementation: string;
  parameters_json: string; tool_enabled: number; attached_enabled: number;
  data_source_id: string; data_source_name: string;
}

export const chatbotInspectorApi = {
  listInspectorConversations: (id: string, params?: { q?: string; lowConfidence?: boolean; escalated?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.lowConfidence) qs.set('lowConfidence', '1');
    if (params?.escalated) qs.set('escalated', '1');
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return apiGet<InspectorConversation[]>(`/api/platform/chatbots/${id}/conversations${tail}`);
  },

  replayMessage: (id: string, messageId: string) =>
    apiPost<{ matchedTrigger: string | null; matchedRule: string | null; confidence: number; shouldRespond: boolean; skipReason: string | null }>(
      `/api/platform/chatbots/${id}/replay`, { messageId },
    ),

  getConversationMessages: (id: string) =>
    apiGet<InspectorMessage[]>(`/api/platform/conversations/${id}/messages`),

  getConversationTraces: (id: string) =>
    apiGet<InspectorTrace[]>(`/api/platform/conversations/${id}/traces`),

  getHealth: (id: string) =>
    apiGet<ChatbotHealth>(`/api/platform/chatbots/${id}/health`),

  testConfig: (id: string, draft_json: string) =>
    apiPost<ChatbotValidationResult>(`/api/platform/chatbots/${id}/test-config`, { draft_json }),

  listVersions: (id: string) =>
    apiGet<ChatbotVersion[]>(`/api/platform/chatbots/${id}/versions`),

  rollback: (id: string, version_id: string) =>
    apiPost<null>(`/api/platform/chatbots/${id}/rollback`, { version_id }),

  getTokenForecast: (id: string) =>
    apiGet<ChatbotTokenForecast>(`/api/platform/chatbots/${id}/token-forecast`),

  listTools: (id: string) =>
    apiGet<ChatbotTool[]>(`/api/platform/chatbots/${id}/tools`),

  attachTools: (id: string, tool_ids: string[]) =>
    apiPost<null>(`/api/platform/chatbots/${id}/tools`, { tool_ids }),

  detachTool: (id: string, toolId: string) =>
    apiDelete<null>(`/api/platform/chatbots/${id}/tools/${toolId}`),

  getTraces: (id: string, params?: { conversationId?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.conversationId) qs.set('conversationId', params.conversationId);
    if (params?.limit) qs.set('limit', String(params.limit));
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return apiGet<Record<string, unknown>[]>(`/api/platform/chatbots/${id}/traces${tail}`);
  },

  publishChatbot: (id: string, draft_json: string) =>
    apiPost<{ jobId: string }>(`/api/platform/chatbots/${id}/publish`, { draft_json }),

  getPublishJob: (id: string) =>
    apiGet<ChatbotPublishJob>(`/api/platform/chatbots/${id}/publish-job`),
};
