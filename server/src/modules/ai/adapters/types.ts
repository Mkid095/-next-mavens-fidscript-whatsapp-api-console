/**
 * LLM Gateway — unified interface for all LLM providers.
 * Supports: gemini, openai, anthropic, azure, byollm (BYOK)
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'model' | 'assistant';
  content: string;
}

export interface LLMResponse {
  reply: string;
  confidence: number;
  sources: string[];
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  raw?: unknown;
  stopReason?: string;
}

export interface LLMConfig {
  model: string;
  provider: string;
  apiKey?: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  maxHistoryMessages?: number;
}

export interface LLMCallOptions {
  messages: LLMMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: LLMTool[];
  stream?: boolean;
}

export interface LLMTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface LLMAdapter {
  provider: string;
  call(options: LLMCallOptions): Promise<LLMResponse>;
  name(): string;
}
