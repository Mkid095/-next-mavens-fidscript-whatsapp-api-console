/**
 * llmGatewayImpl.ts — LLM Gateway implementation.
 */
import type { LLMAdapter, LLMCallOptions, LLMResponse } from './adapters/types.js';
import { GeminiAdapter } from './adapters/gemini.js';
import { BYOLLMAdapter } from './adapters/byollm.js';
import { OpenRouterAdapter } from './adapters/openrouter.js';
import { AnthropicAdapter } from './adapters/anthropic.js';
import { decryptApiKey } from '../../utils/crypto.js';
import type { EncryptedPayload } from '../../utils/crypto.js';
import db from '../../database.js';
import { resolveLLMConfig, type ResolvedLLMConfig } from './contextManager.js';

export { type ResolvedLLMConfig };

export class LLMGateway {
  private readonly _adapter: LLMAdapter;
  private readonly _config: ResolvedLLMConfig;

  constructor(adapter: LLMAdapter, config: ResolvedLLMConfig) {
    this._adapter = adapter;
    this._config = config;
  }

  static resolve(chatbotId: string, workspaceId: string, options?: { forceProvider?: string; forceConnectionId?: string }): LLMGateway {
    const config = resolveLLMConfig(chatbotId, workspaceId, options?.forceProvider, options?.forceConnectionId);
    return new LLMGateway(buildAdapter(config), config);
  }

  static fromConfig(config: ResolvedLLMConfig): LLMGateway {
    return new LLMGateway(buildAdapter(config), config);
  }

  async callWithFallback(options: LLMCallOptions): Promise<LLMResponse> {
    const primaryConfig = this._config;
    const fallbackEntries = primaryConfig.fallbackChain;
    const chainConfigs: ResolvedLLMConfig[] = [primaryConfig];
    for (const entry of fallbackEntries) {
      try {
        const resolved = resolveLLMConfig('', primaryConfig.llmConnectionId, entry.provider, entry.llmConnectionId);
        chainConfigs.push(resolved);
      } catch { /* skip */ }
    }
    let lastError: unknown;
    for (let i = 0; i < chainConfigs.length; i++) {
      const cfg = chainConfigs[i];
      try {
        const gateway = i === 0 ? this : LLMGateway.fromConfig(cfg);
        return await gateway._adapter.call(options);
      } catch (err) {
        lastError = err;
        console.warn(`[LLMGateway] Attempt ${i + 1} failed (provider=${cfg.provider}, model=${cfg.model}):`, String(err));
      }
    }
    throw lastError ?? new Error('All LLM fallback attempts failed');
  }

  async call(options: LLMCallOptions): Promise<LLMResponse> {
    return this._adapter.call(options);
  }

  get provider(): string { return this._adapter.provider; }
  get model(): string { return this._adapter.name(); }
  get config(): ResolvedLLMConfig { return this._config; }
}

// ─── Adapter Builder ──────────────────────────────────────────────────────────

function buildAdapter(config: ResolvedLLMConfig): LLMAdapter {
  const { provider, model, llmConnectionId } = config;

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY env var is not set');
    return new GeminiAdapter(apiKey, model || 'gemini-2.0-flash');
  }

  if (!llmConnectionId) {
    throw new Error(`No LLM connection ID for provider "${provider}" — cannot decrypt API key`);
  }

  const conn = db.prepare('SELECT * FROM llm_connections WHERE id = ?').get(llmConnectionId) as LlConnectionRow | undefined;
  if (!conn) throw new Error(`LLM connection "${llmConnectionId}" not found`);

  let payload: EncryptedPayload;
  if (conn.api_key_encrypted && conn.iv && conn.auth_tag) {
    payload = { iv: conn.iv, authTag: conn.auth_tag, ciphertext: conn.api_key_encrypted, keyVersion: conn.key_version };
  } else if (conn.provider_registry_id) {
    const registry = db.prepare('SELECT * FROM llm_provider_registry WHERE id = ?').get(conn.provider_registry_id) as RegistryRow | undefined;
    if (!registry || !registry.api_key_encrypted) throw new Error(`No API key found for provider "${provider}" — provider registry has no key either`);
    payload = { iv: registry.iv, authTag: registry.auth_tag, ciphertext: registry.api_key_encrypted, keyVersion: registry.key_version };
  } else {
    throw new Error(`No API key found for LLM connection "${llmConnectionId}" and no provider_registry_id to fall back on`);
  }

  const resolvedModel = model || conn.model || defaultModelForProvider(provider);
  const endpoint = config.baseUrl || conn.endpoint || defaultEndpointForProvider(provider);

  if (provider === 'openrouter') return new OpenRouterAdapter(payload, resolvedModel, endpoint);
  if (provider === 'anthropic') return new AnthropicAdapter(payload, resolvedModel);
  return new BYOLLMAdapter(payload, resolvedModel, endpoint);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface LlConnectionRow {
  id: string; provider: string; api_key_encrypted: string | null; api_key_last4: string;
  iv: string; auth_tag: string; key_version: number; model: string; endpoint: string; provider_registry_id: string | null;
}

interface RegistryRow {
  id: string; provider_type: string; api_key_encrypted: string | null;
  iv: string; auth_tag: string; key_version: number; base_url: string; auth_type: string;
}

function defaultEndpointForProvider(provider: string): string {
  const defaults: Record<string, string> = {
    openai: 'https://api.openai.com/v1', openrouter: 'https://openrouter.ai/api/v1',
    azure: '', ollama: 'http://localhost:11434/v1', custom: '',
  };
  return defaults[provider] ?? '';
}

function defaultModelForProvider(provider: string): string {
  const defaults: Record<string, string> = {
    openai: 'gpt-4o-mini', openrouter: 'google/gemini-2.0-flash-free',
    anthropic: 'claude-3-5-haiku-20241022', azure: 'gpt-4o-mini',
    ollama: 'llama3', custom: '', gemini: 'gemini-2.0-flash',
  };
  return defaults[provider] ?? '';
}

export function computeCostUnits(action: 'ai_reply' | 'dataset_search' | 'tool_call' | 'memory_save' | 'knowledge_search'): number {
  switch (action) {
    case 'ai_reply': return 10; case 'dataset_search': return 2;
    case 'tool_call': return 2; case 'memory_save': return 1;
    case 'knowledge_search': return 1; default: return 1;
  }
}
