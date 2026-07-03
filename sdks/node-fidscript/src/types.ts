/**
 * types.ts — request/response shapes for every wrapped endpoint.
 * Kept hand-written (vs OpenAPI-generated) for a focused, friendly DX.
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Auth & account ──────────────────────────────────────────────────────────

export interface Whoami {
  id: string;
  name: string;
  email: string;
  phone: string;
  token_balance: number;
  plan: { id: string; name: string } | null;
  api_key: string;
  instance_count?: number;
}

export interface Usage {
  token_balance: number;
  sends_today: number;
  sends_this_month: number;
  api_requests_today: number;
}

// ── Instance ────────────────────────────────────────────────────────────────

export interface Instance {
  id: string;
  name: string;
  display_name?: string;
  status: string;
  evolution_name?: string;
  phone?: string | null;
  created_at: string;
}

export interface CreateInstance {
  name: string;
  display_name?: string;
}

// ── Sends (10 message types) ───────────────────────────────────────────────

export interface SendText { number: string; message: string; }
export interface SendMedia { number: string; media_url: string; media_type: 'image' | 'video' | 'document' | 'audio'; caption?: string; }
export interface SendLocation { number: string; latitude: number; longitude: number; name?: string; address?: string; }
export interface SendContact { number: string; contact: ContactCard[]; }
export interface SendReaction { number: string; key: MessageKey; reaction: string; }
export interface SendPoll { number: string; name: string; selectableCount: number; values: string[]; }
export interface SendList {
  number: string;
  title: string;
  buttonText: string;
  description?: string;
  footerText?: string;
  sections: ListSection[];
}
export interface SendAudio { number: string; audio: string; }
export interface SendSticker { number: string; sticker: string; }
export interface SendStatus {
  type: 'text' | 'image' | 'audio';
  content: string;
  caption?: string;
  backgroundColor?: string;
  font?: 1 | 2 | 3 | 4;
  allContacts?: boolean;
  statusJidList?: string[];
}

export interface ContactCard {
  fullName: string;
  wuid?: string;
  phoneNumber: string;
  organization?: string;
}
export interface MessageKey { remoteJid: string; fromMe?: boolean; id: string; }
export interface ListSection { title: string; rows: ListRow[]; }
export interface ListRow { title: string; description?: string; rowId: string; }

export interface SendResult { key?: { id?: string }; message?: string; timestamp?: string; }

// ── Chatbot ────────────────────────────────────────────────────────────────

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

export interface ChatbotHealth {
  status: string;
  provider: string;
  model: string | null;
  knowledge: number;
  tools: number;
  triggers: number;
  last_test: string | null;
}

// ── LLM connections (BYO API key) ──────────────────────────────────────────

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