export interface Totals {
  chatbots_total: number;
  chatbots_enabled: number;
  llm_connections_active: number;
  workspaces_with_chatbots: number;
  tokens_this_week: number;
  traces_this_week: number;
}

export interface PerClient {
  client_id: string;
  client_name: string;
  email: string;
  plan_id: string | null;
  chatbot_count: number;
  enabled_count: number;
  tokens_this_week: number;
}

export interface PerProvider {
  provider: string;
  model: string;
  chatbot_count: number;
  workspace_count: number;
}

export interface ResponseType { type: string; count: number; }
export interface HalluPolicy { policy: string; count: number; }
export interface ConfidenceRow {
  chatbot_id: string; chatbot_name: string;
  confidence_threshold: number; escalate_on_low_confidence: number;
  fallback_reply: string | null;
}
export interface RecentTrace {
  id: string; chatbot_id: string; chatbot_name: string | null;
  conversation_id: string | null; prompt: string | null; response: string | null;
  input_tokens: number; output_tokens: number; total_tokens: number;
  cost_usd: number; model: string | null; provider: string | null; created_at: string;
}

export interface AnalyticsPayload {
  totals: Totals;
  perClient: PerClient[];
  perProvider: PerProvider[];
  responseTypes: ResponseType[];
  hallucinationPolicies: HalluPolicy[];
  confidenceThresholds: ConfidenceRow[];
  recentTraces: RecentTrace[];
  as_of: string;
}
