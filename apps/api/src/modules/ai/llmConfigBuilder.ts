/**
 * llmConfigBuilder.ts — config building helpers for LLM resolution.
 */

import db from '../../database.js';
import type { ResolvedLLMConfig, FallbackEntry, LlConnectionRow, ApiFormatRow } from './contextTypes.js';
import { defaultEndpointForProvider, defaultModelForProvider } from './providerDefaults.js';

export function buildSystemFallbackConfig(
  temperature: number,
  fallbackChain: FallbackEntry[]
): ResolvedLLMConfig {
  return {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    llmConnectionId: '',
    providerRegistryId: 'prov_gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    authType: 'bearer',
    maxTokens: 1024,
    temperature,
    contextWindow: 4096,
    fallbackChain,
    apiFormat: resolveApiFormat('gemini'),
  };
}

export function buildConfig(
  conn: LlConnectionRow,
  provider: string,
  model: string,
  maxTokens: number,
  temperature: number,
  fallbackChain: FallbackEntry[]
): ResolvedLLMConfig {
  const resolvedModel = model || conn.model || defaultModelForProvider(provider);
  let contextWindow = 4096;
  let modelConfig: ResolvedLLMConfig['modelConfig'] | undefined;

  const connModel = db.prepare(`
    SELECT * FROM llm_models
    WHERE llm_connection_id = ? AND model_name = ? AND enabled = 1
  `).get(conn.id, resolvedModel) as import('./contextTypes.js').LlModelRow | undefined;

  if (connModel) {
    contextWindow = connModel.context_length;
    modelConfig = {
      supportsTools: Boolean(connModel.supports_tools),
      supportsVision: Boolean(connModel.supports_vision),
      supportsJsonMode: Boolean(connModel.supports_json_mode),
      supportsStreaming: Boolean(connModel.supports_streaming),
      inputCostPer1k: connModel.input_cost_per_1k,
      outputCostPer1k: connModel.output_cost_per_1k,
    };
  } else if (conn.provider_registry_id) {
    const providerModel = db.prepare(`
      SELECT context_length FROM llm_provider_models
      WHERE provider_registry_id = ? AND model_id = ? AND enabled = 1
    `).get(conn.provider_registry_id, resolvedModel) as { context_length: number } | undefined;
    if (providerModel) contextWindow = providerModel.context_length;
  }

  return {
    provider,
    model: resolvedModel,
    llmConnectionId: conn.id,
    providerRegistryId: conn.provider_registry_id || '',
    baseUrl: conn.endpoint || defaultEndpointForProvider(provider),
    authType: 'bearer',
    maxTokens,
    temperature,
    contextWindow,
    fallbackChain,
    modelConfig,
    apiFormat: resolveApiFormat(provider),
  };
}

export function resolveApiFormat(provider: string): ResolvedLLMConfig['apiFormat'] | undefined {
  const row = db.prepare(`
    SELECT * FROM llm_api_formats WHERE provider_type = ? LIMIT 1
  `).get(provider) as ApiFormatRow | undefined;
  if (!row) return undefined;
  return {
    formatId: row.id,
    formatName: row.name,
    requestType: row.request_type,
    supportsTools: Boolean(row.supports_tools),
    supportsStreaming: Boolean(row.supports_streaming),
  };
}

export function loadConnectionById(connectionId: string, workspaceId: string): LlConnectionRow | undefined {
  return db.prepare(
    'SELECT * FROM llm_connections WHERE id = ? AND workspace_id = ? AND enabled = 1'
  ).get(connectionId, workspaceId) as LlConnectionRow | undefined;
}
