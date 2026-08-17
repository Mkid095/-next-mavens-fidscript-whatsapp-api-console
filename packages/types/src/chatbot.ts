/**
 * chatbot.ts - Chatbot and AI configuration types shared across SDK, CLI, and frontend.
 */

// ── Chatbot ──────────────────────────────────────────────────────────────────

export interface Chatbot {
  id: string;
  workspace_id: string;
  instance_id: string;
  name: string;
  description: string;
  priority: number;
  enabled: 0 | 1;
  trigger_count?: number;
  contact_count?: number;
  instance_name?: string | null;
  created_at: string;
}

export interface ChatbotHealth {
  status: string;
  provider: string;
  model: string | null;
  knowledge: number;
  tools: number;
  triggers: number;
  last_test: string | null;
}

export interface ChatbotAiConfig {
  model?: string;
  provider?: string;
  system_prompt?: string;
  hallucination_policy?: 'strict' | 'balanced' | 'creative' | 'disabled';
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  max_history_messages?: number;
  llm_connection_id?: string;
}

// ── LLM connections (BYO API key) ───────────────────────────────────────────

export interface LlmConnection {
  id: string;
  provider: string;
  model: string;
  endpoint: string;
  is_default: 0 | 1;
  enabled: 0 | 1;
  api_key_last4: string;
  monthly_limit: number;
  provider_name: string | null;
  created_at: string;
}

export interface CreateLlmConnection {
  provider: string;
  model: string;
  api_key?: string;
  endpoint?: string;
  is_default?: boolean;
  monthly_limit?: number;
  priority?: number;
  provider_registry_id?: string;
}
