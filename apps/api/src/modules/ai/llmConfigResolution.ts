/**
 * llmConfigResolution.ts — LLM config resolution logic.
 *
 * Handles provider/connection resolution for the chatbot AI brain.
 * Resolution order: explicit connection → workspace default → provider default → system fallback.
 */

import db from '../../database.js';
import type { ResolvedLLMConfig, FallbackEntry, LlConnectionRow, RegistryRow } from './contextTypes.js';
import { defaultModelForProvider } from './providerDefaults.js';
import {
  buildSystemFallbackConfig,
  buildConfig,
  resolveApiFormat,
  loadConnectionById as _loadConnectionById,
} from './llmConfigBuilder.js';

// ─── Main Resolver ─────────────────────────────────────────────────────────────

/**
 * Resolve the correct LLM config for a chatbot.
 * Resolution order: explicit connection → workspace default → provider default → system fallback
 */
export function resolveLLMConfig(
  chatbotId: string,
  workspaceId: string,
  forceProvider?: string,
  forceConnectionId?: string
): ResolvedLLMConfig {
  const bot = db.prepare(
    'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ? AND enabled = 1'
  ).get(chatbotId, workspaceId) as import('./contextTypes.js').ChatbotRow | undefined;

  if (!bot) {
    return buildSystemFallbackConfig(0.7, []);
  }

  const aiConfig = db.prepare(
    'SELECT * FROM chatbot_ai_configs WHERE chatbot_id = ?'
  ).get(chatbotId) as import('./contextTypes.js').ChatbotAIConfigRow | undefined;

  const provider = forceProvider || aiConfig?.provider || 'gemini';
  const model = aiConfig?.model || defaultModelForProvider(provider);
  const maxTokens = aiConfig?.max_tokens || 1024;
  const temperature = aiConfig?.temperature ?? 0.7;
  const fallbackChain = loadFallbackChain(workspaceId);

  if (forceConnectionId) {
    const explicit = _loadConnectionById(forceConnectionId, workspaceId);
    if (explicit) return buildConfig(explicit, provider, model, maxTokens, temperature, fallbackChain);
  }

  if (aiConfig?.llm_connection_id) {
    const conn = _loadConnectionById(aiConfig.llm_connection_id, workspaceId);
    if (conn) return buildConfig(conn, provider, model, maxTokens, temperature, fallbackChain);
  }

  const workspaceDefault = db.prepare(`
    SELECT lc.* FROM llm_connections lc
    JOIN llm_provider_registry lpr ON lpr.id = lc.provider_registry_id
    WHERE lc.workspace_id = ? AND lpr.provider_type = ? AND lc.enabled = 1 AND lc.is_default = 1
    LIMIT 1
  `).get(workspaceId, provider) as LlConnectionRow | undefined;

  if (workspaceDefault) return buildConfig(workspaceDefault, provider, model, maxTokens, temperature, fallbackChain);

  const registryDefault = db.prepare(`
    SELECT * FROM llm_provider_registry
    WHERE provider_type = ? AND enabled = 1 AND is_default = 1
    LIMIT 1
  `).get(provider) as RegistryRow | undefined;

  if (registryDefault) {
    return {
      provider,
      model,
      llmConnectionId: '',
      providerRegistryId: registryDefault.id,
      baseUrl: registryDefault.base_url,
      authType: registryDefault.auth_type,
      maxTokens,
      temperature,
      contextWindow: 4096,
      fallbackChain,
      apiFormat: resolveApiFormat(provider),
    };
  }

  return buildSystemFallbackConfig(temperature, fallbackChain);
}

/**
 * Load the workspace's ordered fallback chain.
 * Returns entries ordered by priority (first = primary, rest = fallbacks).
 */
export function loadFallbackChain(workspaceId: string): FallbackEntry[] {
  const rows = db.prepare(`
    SELECT lfc.chain_json, lc.provider, lc.model, lc.id as llm_connection_id
    FROM llm_fallback_chain lfc
    LEFT JOIN llm_connections lc ON lc.workspace_id = lfc.workspace_id AND lc.enabled = 1
    WHERE lfc.workspace_id = ? AND lfc.enabled = 1
    ORDER BY lfc.is_default DESC, lfc.created_at ASC
    LIMIT 1
  `).get(workspaceId) as { chain_json: string; provider: string; model: string; llm_connection_id: string } | undefined;

  if (!rows || !rows.chain_json) return [];

  try {
    const chain = JSON.parse(rows.chain_json) as Array<{ provider: string; model: string; connectionId?: string }>;
    return chain.map(entry => ({
      provider: entry.provider,
      model: entry.model,
      llmConnectionId: entry.connectionId || '',
    }));
  } catch {
    return [];
  }
}
