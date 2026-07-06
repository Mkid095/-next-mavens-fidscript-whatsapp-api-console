import type { AIProvider } from '../../types';

export interface SharedProvider {
  id: string;
  provider_type: string;
  name: string;
  description: string;
  base_url: string;
}

export interface WorkspaceConnection {
  id: string;
  name: string;
  provider: string;
  api_key_last4: string;
  model: string;
  endpoint: string;
  enabled: number;
}

export interface ProviderModel {
  id: string;
  model_id: string;
  model_name: string;
  context_length: number;
}

export type HallucinationPolicy = 'strict' | 'balanced' | 'creative';

export interface MemorySetting {
  label: string;
  description: string;
  enabled: boolean;
}

export interface AIBrainDraft {
  provider: AIProvider;
  providerName: string;
  baseUrl: string;
  llmConnectionId: string;
  model: string;
  contextLength?: number;
  memorySettings: MemorySetting[];
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
  hallucinationPolicy: HallucinationPolicy;
}
