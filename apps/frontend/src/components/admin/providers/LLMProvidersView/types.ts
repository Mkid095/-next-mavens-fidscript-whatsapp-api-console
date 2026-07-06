/**
 * Shared types and constants for LLM Providers view.
 */
export interface LLMProvider {
  id: string;
  provider_type: string;
  name: string;
  description: string;
  base_url: string;
  auth_type: string;
  api_key_last4: string;
  is_default: number;
  is_free_tier: number;
  free_quota_tokens: number;
  is_shared: number;
  config_json: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderModel {
  id: string;
  model_id: string;
  model_name: string;
  context_length: number;
  supports_tools: number;
  supports_json_mode: number;
  latency_class: string;
  cost_per_1k_input_tokens: number;
  cost_per_1k_output_tokens: number;
  enabled: number;
}

export interface ProviderFormData {
  name: string;
  provider_type: string;
  description: string;
  base_url: string;
  auth_type: string;
  api_key: string;
  is_free_tier: boolean;
  free_quota_tokens: string;
  is_default: boolean;
  enabled: boolean;
}

export interface TestResult {
  ok: boolean;
  models?: string[];
  total?: number;
  imported?: number;
  error?: string;
}

export type StatusFilter = 'all' | 'active' | 'disabled';
export type StatFilter = null | 'total' | 'active' | 'default' | 'shared';
export type ViewMode = 'grid' | 'list';

export const PROVIDER_META: Record<string, { label: string; defaultUrl: string }> = {
  openai:     { label: 'OpenAI',        defaultUrl: 'https://api.openai.com/v1' },
  openrouter: { label: 'OpenRouter',    defaultUrl: 'https://openrouter.ai/api/v1' },
  anthropic:  { label: 'Anthropic',     defaultUrl: 'https://api.anthropic.com' },
  azure:      { label: 'Azure OpenAI',  defaultUrl: '' },
  gemini:     { label: 'Google Gemini', defaultUrl: 'https://generativelanguage.googleapis.com' },
  ollama:     { label: 'Ollama',        defaultUrl: 'http://localhost:11434/v1' },
  minimax:    { label: 'MiniMax',       defaultUrl: 'https://api.minimax.io/anthropic' },
  custom:     { label: 'Custom API',    defaultUrl: '' },
};

export const PROVIDER_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  openai:     { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
  anthropic:  { bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-400',  glow: 'shadow-orange-500/10' },
  gemini:     { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    glow: 'shadow-blue-500/10' },
  minimax:    { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/40',  text: 'text-yellow-400',  glow: 'shadow-yellow-500/20' },
  openrouter: { bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  text: 'text-purple-400',  glow: 'shadow-purple-500/10' },
  ollama:     { bg: 'bg-zinc-500/10',    border: 'border-zinc-500/30',    text: 'text-zinc-300',    glow: 'shadow-zinc-500/10' },
  azure:      { bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     text: 'text-sky-400',     glow: 'shadow-sky-500/10' },
  custom:     { bg: 'bg-pink-500/10',    border: 'border-pink-500/30',    text: 'text-pink-400',    glow: 'shadow-pink-500/10' },
};

export const DEFAULT_COLORS = { bg: 'bg-[#2d2813]', border: 'border-[#3d3a1e]', text: 'text-[#a8a99e]', glow: 'shadow-black/10' };

export const fieldClass =
  'w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-[#cbd3cf] placeholder-[#525345] focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/20 transition-colors';

export const fieldClassMono =
  'w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-[#cbd3cf] font-mono placeholder-[#525345] focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/20 transition-colors';
