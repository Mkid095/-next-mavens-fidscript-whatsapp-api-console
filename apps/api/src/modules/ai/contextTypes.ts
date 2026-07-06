/**
 * contextTypes.ts — database row types for the LLM config system.
 */

export interface ResolvedLLMConfig {
  provider: string;
  model: string;
  llmConnectionId: string;
  providerRegistryId: string;
  baseUrl: string;
  authType: string;
  maxTokens: number;
  temperature: number;
  contextWindow: number;
  fallbackChain: FallbackEntry[];
  modelConfig?: {
    supportsTools: boolean;
    supportsVision: boolean;
    supportsJsonMode: boolean;
    supportsStreaming: boolean;
    inputCostPer1k: number;
    outputCostPer1k: number;
  };
  apiFormat?: {
    formatId: string;
    formatName: string;
    requestType: string;
    supportsTools: boolean;
    supportsStreaming: boolean;
  };
}

export interface FallbackEntry {
  provider: string;
  model: string;
  llmConnectionId: string;
}

// ─── Database Row Types ────────────────────────────────────────────────────────

interface ChatbotRow {
  id: string;
  workspace_id: string;
  instance_id: string;
  name: string;
  description: string;
  enabled: number;
  priority: number;
  config_json: string;
  created_at: string;
  updated_at: string;
}

interface ChatbotAIConfigRow {
  id: string;
  chatbot_id: string;
  model: string;
  provider: string;
  prompt: string;
  system_prompt: string;
  hallucination_policy: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
  max_history_messages: number;
  llm_connection_id: string | null;
  created_at: string;
  updated_at: string;
}

interface LlConnectionRow {
  id: string;
  workspace_id: string;
  provider: string;
  provider_registry_id: string | null;
  model: string;
  endpoint: string;
  api_key_encrypted: string;
  iv: string;
  auth_tag: string;
  key_version: number;
  enabled: number;
  is_default: number;
}

interface RegistryRow {
  id: string;
  provider_type: string;
  name: string;
  base_url: string;
  auth_type: string;
  is_default: number;
  enabled: number;
}

interface LlModelRow {
  id: string;
  llm_connection_id: string;
  model_name: string;
  context_length: number;
  supports_tools: number;
  supports_vision: number;
  supports_json_mode: number;
  supports_streaming: number;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  enabled: number;
}

interface ApiFormatRow {
  id: string;
  name: string;
  provider_type: string;
  request_type: string;
  request_template_json: string;
  response_parser: string;
  supports_tools: number;
  supports_streaming: number;
}

// Re-export for use in contextUtils
export type { ChatbotRow, ChatbotAIConfigRow, LlConnectionRow, RegistryRow, LlModelRow, ApiFormatRow };
