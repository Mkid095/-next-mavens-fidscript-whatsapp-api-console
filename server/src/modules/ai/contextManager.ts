/**
 * contextManager.ts — builds LLM-ready context from memory + knowledge + config.
 *
 * 3-layer memory model:
 *   short_term  — last N messages in session
 *   long_term   — persisted facts/preferences/intent
 *   knowledge   — indexed business data (RAG-style)
 *
 * Resolution order for provider selection:
 *   1. chatbot.llm_connection_id (explicit override)
 *   2. workspace default connection for provider
 *   3. provider_registry default for that type
 *   4. system fallback (gemini built-in)
 */

import db from '../../database.js';
import { loadMemory, formatMemoryContext } from './memoryService.js';
import { retrieveKnowledge, formatKnowledgeContext } from './knowledgeService.js';

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
  /** Per-connection model config (from llm_models table) */
  modelConfig?: {
    supportsTools: boolean;
    supportsVision: boolean;
    supportsJsonMode: boolean;
    supportsStreaming: boolean;
    inputCostPer1k: number;
    outputCostPer1k: number;
  };
  /** API format config (from llm_api_formats) */
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

export interface BuildContextOptions {
  chatbotId: string;
  workspaceId: string;
  conversationId: string;
  contactId?: string;
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  maxHistoryMessages?: number; // default 20
  forceProvider?: string;      // override provider selection
  forceConnectionId?: string;  // use specific connection
}

export interface BuiltContext {
  /** Messages ready to send (trimmed to token budget) */
  messages: Array<{ role: string; content: string }>;
  /** System prompt with memory + knowledge injected */
  systemPrompt: string;
  /** Resolved LLM configuration */
  llmConfig: ResolvedLLMConfig;
  /** Token budget used by this context */
  tokenBudget: TokenBudget;
}

export interface TokenBudget {
  systemPromptTokens: number;
  historyTokens: number;
  availableForResponse: number;
  totalContextWindow: number;
}

/** Rough token estimate: ~4 chars per token for English text */
const CHARS_PER_TOKEN = 4;

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
  // 1. Load chatbot config
  const bot = db.prepare(
    'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ? AND enabled = 1'
  ).get(chatbotId, workspaceId) as ChatbotRow | undefined;

  const provider = forceProvider || bot?.provider || 'gemini';
  const model = bot?.model || defaultModelForProvider(provider);
  const maxTokens = bot?.max_tokens || 1024;
  const temperature = bot?.temperature ?? 0.7;

  // 2. Load workspace's fallback chain (if any)
  const fallbackChain = loadFallbackChain(workspaceId);

  // 3. Try explicit connection override first
  if (forceConnectionId) {
    const explicit = loadConnectionById(forceConnectionId, workspaceId);
    if (explicit) return buildConfig(explicit, provider, model, maxTokens, temperature, fallbackChain);
  }

  // 4. Try chatbot's own llm_connection_id
  if (bot?.llm_connection_id) {
    const conn = loadConnectionById(bot.llm_connection_id, workspaceId);
    if (conn) return buildConfig(conn, provider, model, maxTokens, temperature, fallbackChain);
  }

  // 5. Try workspace default for this provider type
  const workspaceDefault = db.prepare(`
    SELECT lc.* FROM llm_connections lc
    JOIN llm_provider_registry lpr ON lpr.id = lc.provider_registry_id
    WHERE lc.workspace_id = ? AND lpr.provider_type = ? AND lc.enabled = 1 AND lc.is_default = 1
    LIMIT 1
  `).get(workspaceId, provider) as LlConnectionRow | undefined;

  if (workspaceDefault) return buildConfig(workspaceDefault, provider, model, maxTokens, temperature, fallbackChain);

  // 6. Try provider registry default for this type
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

  // 7. System fallback: Gemini built-in
  return {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    llmConnectionId: '',
    providerRegistryId: 'prov_gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    authType: 'bearer',
    maxTokens,
    temperature,
    contextWindow: 4096,
    fallbackChain,
    apiFormat: resolveApiFormat('gemini'),
  };
}

function buildConfig(
  conn: LlConnectionRow,
  provider: string,
  model: string,
  maxTokens: number,
  temperature: number,
  fallbackChain: FallbackEntry[]
): ResolvedLLMConfig {
  const resolvedModel = model || conn.model || defaultModelForProvider(provider);

  // Load model info — per-connection override (llm_models) takes precedence over
  // provider-level defaults (llm_provider_models).
  let contextWindow = 4096;
  let modelConfig: ResolvedLLMConfig['modelConfig'] | undefined;

  // First try per-connection llm_models table
  const connModel = db.prepare(`
    SELECT * FROM llm_models
    WHERE llm_connection_id = ? AND model_name = ? AND enabled = 1
  `).get(conn.id, resolvedModel) as LlModelRow | undefined;

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
    // Fall back to provider-level model registry
    const providerModel = db.prepare(`
      SELECT context_length FROM llm_provider_models
      WHERE provider_registry_id = ? AND model_id = ? AND enabled = 1
    `).get(conn.provider_registry_id, resolvedModel) as { context_length: number } | undefined;
    if (providerModel) contextWindow = providerModel.context_length;
  }

  // Resolve API format from llm_api_formats
  const apiFormat = resolveApiFormat(provider);

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
    apiFormat,
  };
}

function resolveApiFormat(provider: string): ResolvedLLMConfig['apiFormat'] | undefined {
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

/**
 * Load a connection by ID, verifying workspace ownership.
 */
function loadConnectionById(connectionId: string, workspaceId: string): LlConnectionRow | undefined {
  return db.prepare(
    'SELECT * FROM llm_connections WHERE id = ? AND workspace_id = ? AND enabled = 1'
  ).get(connectionId, workspaceId) as LlConnectionRow | undefined;
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

/**
 * Build a complete LLM-ready context for a chatbot conversation.
 *
 * 1. Loads memory (short-term + long-term + facts + preferences)
 * 2. Searches relevant knowledge
 * 3. Builds system prompt with injected context
 * 4. Trims message history to fit token budget
 */
export async function buildContext(options: BuildContextOptions): Promise<BuiltContext> {
  const {
    chatbotId,
    workspaceId,
    conversationId,
    contactId,
    systemPrompt,
    messages,
    maxHistoryMessages = 20,
    forceProvider,
    forceConnectionId,
  } = options;

  // Resolve LLM config
  const llmConfig = resolveLLMConfig(chatbotId, workspaceId, forceProvider, forceConnectionId);

  // Load memory
  const memory = loadMemory(conversationId, chatbotId);

  // Load knowledge relevant to last message (RAG-style)
  const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
  const knowledgeResults = lastMessage.length > 3
    ? await retrieveKnowledge(chatbotId, lastMessage, 3)
    : [];

  // Build injected system context
  const memoryContext = formatMemoryContext(memory);
  const knowledgeContext = knowledgeResults.length > 0
    ? `\n--- KNOWLEDGE BASE ---\n${formatKnowledgeContext(knowledgeResults)}\n--- END KNOWLEDGE ---\n`
    : '';

  // Estimate system prompt tokens
  const systemInjection = memoryContext + knowledgeContext;
  const systemPromptTokens = Math.ceil((systemPrompt.length + systemInjection.length) / CHARS_PER_TOKEN);
  const totalContextWindow = llmConfig.contextWindow;
  const maxResponseTokens = llmConfig.maxTokens;
  const availableForHistory = totalContextWindow - systemPromptTokens - maxResponseTokens;

  // Trim message history to fit token budget
  const trimmedMessages = trimMessageHistory(messages, availableForHistory, maxHistoryMessages);
  const historyTokens = Math.ceil(trimmedMessages.reduce((sum, m) => sum + m.content.length, 0) / CHARS_PER_TOKEN);

  return {
    messages: trimmedMessages,
    systemPrompt: systemPrompt + memoryContext + knowledgeContext,
    llmConfig,
    tokenBudget: {
      systemPromptTokens,
      historyTokens,
      availableForResponse: maxResponseTokens,
      totalContextWindow,
    },
  };
}

/**
 * Trim message history to fit within token budget, keeping most recent messages.
 */
function trimMessageHistory(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  maxMessages: number
): Array<{ role: string; content: string }> {
  const recent = messages.slice(-maxMessages);
  let usedTokens = 0;
  const result: Array<{ role: string; content: string }> = [];

  for (let i = recent.length - 1; i >= 0; i--) {
    const msgTokens = Math.ceil(recent[i].content.length / CHARS_PER_TOKEN);
    if (usedTokens + msgTokens > maxTokens) break;
    result.unshift(recent[i]);
    usedTokens += msgTokens;
  }

  return result;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatbotRow {
  id: string;
  workspace_id: string;
  provider: string;
  model: string;
  max_tokens: number;
  temperature: number;
  llm_connection_id: string | null;
  enabled: number;
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

// ─── Defaults ─────────────────────────────────────────────────────────────────

function defaultEndpointForProvider(provider: string): string {
  const defaults: Record<string, string> = {
    openai:     'https://api.openai.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    azure:      '',
    ollama:     'http://localhost:11434/v1',
    custom:     '',
    gemini:     'https://generativelanguage.googleapis.com',
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
  return defaults[provider] ?? 'gpt-4o-mini';
}