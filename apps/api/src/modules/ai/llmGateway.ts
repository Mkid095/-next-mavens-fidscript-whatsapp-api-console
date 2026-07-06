/**
 * LLM Gateway — unified factory for all LLM providers.
 *
 * Resolution order (deterministic):
 *   1. chatbot.llm_connection_id  (explicit override)
 *   2. workspace default for provider type
 *   3. provider_registry default
 *   4. system fallback (gemini built-in)
 *
 * Providers:
 *   gemini      — Google Gemini (uses GEMINI_API_KEY env)
 *   openai     — OpenAI GPT models (BYOK, AES-256-GCM encrypted)
 *   openrouter — OpenRouter gateway (BYOK)
 *   anthropic  — Anthropic Claude (dedicated /messages/v1/messages endpoint)
 *   azure      — Azure OpenAI (OpenAI-compatible, Azure AD auth)
 *   ollama     — Local Ollama (OpenAI-compatible)
 *   custom     — Any OpenAI-compatible API
 *
 * API keys are decrypted ONLY inside this module (worker-only boundary).
 */
import type { LLMAdapter, LLMCallOptions, LLMResponse } from './adapters/types.js';
import { GeminiAdapter } from './adapters/gemini.js';
import { BYOLLMAdapter } from './adapters/byollm.js';
import { OpenRouterAdapter } from './adapters/openrouter.js';
import { AnthropicAdapter } from './adapters/anthropic.js';
import { decryptApiKey } from '../../utils/crypto.js';
import type { EncryptedPayload } from '../../utils/crypto.js';
import db from '../../database.js';
import { resolveLLMConfig, loadFallbackChain, type ResolvedLLMConfig, type FallbackEntry } from './contextManager.js';

export { type ResolvedLLMConfig, type FallbackEntry };

export class LLMGateway {
  private readonly _adapter: LLMAdapter;
  private readonly _config: ResolvedLLMConfig;

  constructor(adapter: LLMAdapter, config: ResolvedLLMConfig) {
    this._adapter = adapter;
    this._config = config;
  }

  /**
   * Primary entry point — resolve a chatbot to its LLM configuration,
   * then return a gateway ready to call.
   *
   * Resolution order:
   *   1. Explicit llm_connection_id on chatbot
   *   2. Workspace default for the provider
   *   3. Provider registry default for the type
   *   4. System fallback (gemini)
   */
  static resolve(
    chatbotId: string,
    workspaceId: string,
    options?: { forceProvider?: string; forceConnectionId?: string }
  ): LLMGateway {
    const config = resolveLLMConfig(chatbotId, workspaceId, options?.forceProvider, options?.forceConnectionId);
    const adapter = buildAdapter(config);
    return new LLMGateway(adapter, config);
  }

  /**
   * Build a gateway from an already-resolved config (for fallback chain use).
   */
  static fromConfig(config: ResolvedLLMConfig): LLMGateway {
    const adapter = buildAdapter(config);
    return new LLMGateway(adapter, config);
  }

  /**
   * Call the LLM with automatic fallback on failure.
   * Tries primary, then each entry in the fallback chain in order.
   * Logs failure reason for each step.
   */
  async callWithFallback(options: LLMCallOptions): Promise<LLMResponse> {
    const primaryConfig = this._config;
    const fallbackEntries = primaryConfig.fallbackChain;

    // Build full chain: primary first, then fallbacks
    const chainConfigs: ResolvedLLMConfig[] = [primaryConfig];
    for (const entry of fallbackEntries) {
      try {
        // Resolve each fallback entry with workspace context
        const resolved = resolveLLMConfig('', primaryConfig.llmConnectionId, entry.provider, entry.llmConnectionId);
        chainConfigs.push(resolved);
      } catch {
        // Skip entries that can't be resolved
      }
    }

    let lastError: unknown;

    for (let i = 0; i < chainConfigs.length; i++) {
      const cfg = chainConfigs[i];
      try {
        const gateway = i === 0 ? this : LLMGateway.fromConfig(cfg);
        const response = await gateway._adapter.call(options);
        return response;
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
  const { provider, model, llmConnectionId, baseUrl } = config;

  // Built-in Gemini (env var)
  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY env var is not set');
    return new GeminiAdapter(apiKey, model || 'gemini-2.0-flash');
  }

  // All BYOK providers need a connection ID to decrypt the key
  if (!llmConnectionId) {
    throw new Error(`No LLM connection ID for provider "${provider}" — cannot decrypt API key`);
  }

  const conn = db.prepare(
    'SELECT * FROM llm_connections WHERE id = ?'
  ).get(llmConnectionId) as LlConnectionRow | undefined;

  if (!conn) throw new Error(`LLM connection "${llmConnectionId}" not found`);

  const payload: EncryptedPayload = {
    iv: conn.iv,
    authTag: conn.auth_tag,
    ciphertext: conn.api_key_encrypted,
    keyVersion: conn.key_version,
  };

  const resolvedModel = model || conn.model || defaultModelForProvider(provider);
  const endpoint = baseUrl || conn.endpoint || defaultEndpointForProvider(provider);

  if (provider === 'openrouter') {
    return new OpenRouterAdapter(payload, resolvedModel, endpoint);
  }

  if (provider === 'anthropic') {
    return new AnthropicAdapter(payload, resolvedModel);
  }

  // openai, azure, ollama, custom — all OpenAI-compatible
  return new BYOLLMAdapter(payload, resolvedModel, endpoint);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface LlConnectionRow {
  id: string;
  provider: string;
  api_key_encrypted: string;
  api_key_last4: string;
  iv: string;
  auth_tag: string;
  key_version: number;
  model: string;
  endpoint: string;
  provider_registry_id: string | null;
}

function defaultEndpointForProvider(provider: string): string {
  const defaults: Record<string, string> = {
    openai:     'https://api.openai.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    azure:      '',
    ollama:     'http://localhost:11434/v1',
    custom:     '',
  };
  return defaults[provider] ?? '';
}

function defaultModelForProvider(provider: string): string {
  const defaults: Record<string, string> = {
    openai:     'gpt-4o-mini',
    openrouter: 'google/gemini-2.0-flash-free',
    anthropic:  'claude-3-5-haiku-20241022',
    azure:      'gpt-4o-mini',
    ollama:     'llama3',
    custom:     '',
    gemini:     'gemini-2.0-flash',
  };
  return defaults[provider] ?? '';
}

// ─── Token billing units ──────────────────────────────────────────────────────

export function computeCostUnits(
  action: 'ai_reply' | 'dataset_search' | 'tool_call' | 'memory_save' | 'knowledge_search'
): number {
  switch (action) {
    case 'ai_reply':        return 10;
    case 'dataset_search':  return 2;
    case 'tool_call':       return 2;
    case 'memory_save':     return 1;
    case 'knowledge_search': return 1;
    default:                return 1;
  }
}