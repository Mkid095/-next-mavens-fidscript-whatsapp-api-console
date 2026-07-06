/**
 * Phase 13: LLM Model Configs + API Format Registry + Enhanced Chatbot Settings
 *
 * 1. llm_models               — per-connection model configs (costs, capabilities)
 * 2. llm_api_formats          — API format registry (request templates, response parsers)
 * 3. chatbot_group_settings    — reply probability, cooldown, prefix requirements
 * 4. chatbot_contact_assignments — per-contact bot routing mode (ai/manual/disabled)
 */
import type { Database } from 'sql.js';

export function runPhase13Migrations(db: Database): void {

  // ─── Per-Connection Model Configs ───────────────────────────────────────────
  // A connection can override per-model costs and capabilities (workspace-specific
  // pricing tiers, disabled features, etc.). Falls back to llm_provider_models.

  try { db.run(`CREATE TABLE IF NOT EXISTS llm_models (
    id TEXT PRIMARY KEY,
    llm_connection_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    context_length INTEGER DEFAULT 4096,
    supports_tools INTEGER DEFAULT 0,
    supports_vision INTEGER DEFAULT 0,
    supports_json_mode INTEGER DEFAULT 0,
    supports_streaming INTEGER DEFAULT 0,
    input_cost_per_1k REAL DEFAULT 0,
    output_cost_per_1k REAL DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (llm_connection_id) REFERENCES llm_connections(id) ON DELETE CASCADE,
    UNIQUE(llm_connection_id, model_name)
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_llm_models_connection ON llm_models(llm_connection_id)`); } catch (_) { /* ok */ }

  // ─── API Format Registry ────────────────────────────────────────────────────
  // Central registry for API formats so new providers don't require code changes.
  // Maps provider_type → request template + response parser path.

  try { db.run(`CREATE TABLE IF NOT EXISTS llm_api_formats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    provider_type TEXT NOT NULL,
    request_type TEXT NOT NULL,
    request_template_json TEXT NOT NULL DEFAULT '{}',
    response_parser TEXT NOT NULL DEFAULT 'json',
    supports_tools INTEGER DEFAULT 0,
    supports_streaming INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* ok */ }

  // Seed standard API formats
  try {
    const fmtOpenAIChat = JSON.stringify({
      endpoint: '/v1/chat/completions', method: 'POST',
      body_template: { model: '${model}', messages: '${messages}', temperature: '${temperature}', max_tokens: '${max_tokens}' },
      messages_path: 'choices[0].message.content',
    });
    const fmtOpenAIResp = JSON.stringify({
      endpoint: '/v1/responses', method: 'POST',
      body_template: { model: '${model}', input: '${input}' },
      messages_path: 'output[0].content[0].text',
    });
    const fmtOpenRouter = JSON.stringify({
      endpoint: '/v1/chat/completions', method: 'POST',
      body_template: { model: '${model}', messages: '${messages}' },
      messages_path: 'choices[0].message.content',
      extra_headers: { 'HTTP-Referer': '${referer}', 'X-Title': '${app_name}' },
    });
    const fmtAnthropic = JSON.stringify({
      endpoint: '/v1/messages', method: 'POST',
      body_template: { model: '${model}', messages: '${messages}', max_tokens: '${max_tokens}' },
      messages_path: 'content[0].text',
      required_headers: ['anthropic-version: 2023-06-01'],
    });
    const fmtGemini = JSON.stringify({
      endpoint: '/v1beta/models/${model}:generateContent', method: 'POST',
      body_template: { contents: '${contents}' },
      messages_path: 'candidates[0].content.parts[0].text',
    });
    const fmtAzure = JSON.stringify({
      endpoint: '/openai/deployments/${deployment}/chat/completions', method: 'POST',
      body_template: { messages: '${messages}' },
      messages_path: 'choices[0].message.content',
    });
    const fmtOllama = JSON.stringify({
      endpoint: '/api/chat', method: 'POST',
      body_template: { model: '${model}', messages: '${messages}' },
      messages_path: 'message.content',
    });
    const fmtCustom = JSON.stringify({
      endpoint: '/v1/chat/completions', method: 'POST',
      body_template: { model: '${model}', messages: '${messages}' },
      messages_path: 'choices[0].message.content',
    });

    // Build request_type values that contain ${
    const geminiReqType = '/v1beta/models/' + '${model}:generateContent';
    const azureReqType = '/openai/deployments/' + '${deployment}/chat/completions';

    db.run(`INSERT OR IGNORE INTO llm_api_formats
      (id, name, provider_type, request_type, request_template_json, response_parser, supports_tools, supports_streaming)
      VALUES
      ('fmt_openai_chat', 'OpenAI Chat Completions', 'openai', '/v1/chat/completions', ?, 'openai_chat', 1, 1),
      ('fmt_openai_resp', 'OpenAI Responses API', 'openai', '/v1/responses', ?, 'openai_response', 0, 0),
      ('fmt_openrouter', 'OpenRouter', 'openrouter', '/v1/chat/completions', ?, 'openai_chat', 1, 1),
      ('fmt_anthropic', 'Anthropic Messages', 'anthropic', '/v1/messages', ?, 'anthropic', 1, 0),
      ('fmt_gemini', 'Gemini generateContent', 'gemini', '` + geminiReqType + `', ?, 'gemini', 0, 0),
      ('fmt_azure', 'Azure OpenAI', 'azure', '` + azureReqType + `', ?, 'azure', 1, 0),
      ('fmt_ollama', 'Ollama', 'ollama', '/api/chat', ?, 'ollama', 0, 1),
      ('fmt_custom', 'Custom OpenAI-Compatible', 'custom', '/v1/chat/completions', ?, 'openai_chat', 1, 1)`,
      [fmtOpenAIChat, fmtOpenAIResp, fmtOpenRouter, fmtAnthropic, fmtGemini, fmtAzure, fmtOllama, fmtCustom]);
  } catch (_) { /* may already exist */ }

  // ─── Chatbot Group Settings ──────────────────────────────────────────────────
  // Per-chatbot group behavior: reply probability, cooldown, prefix gating.

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_group_settings (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    reply_probability REAL DEFAULT 1.0
      CHECK(reply_probability >= 0 AND reply_probability <= 1),
    cooldown_seconds INTEGER DEFAULT 0,
    require_prefix INTEGER DEFAULT 0,
    prefix TEXT DEFAULT '@bot',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  // ─── Chatbot Contact Assignments ─────────────────────────────────────────────
  // Per-contact routing mode: 'ai' (bot handles), 'manual' (human only), 'disabled' (no bot).

  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_contact_assignments (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    contact_id TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'ai'
      CHECK(mode IN ('ai','manual','disabled')),
    assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    UNIQUE(chatbot_id, contact_id)
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_contact_assignments_chatbot ON chatbot_contact_assignments(chatbot_id)`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_contact_assignments_contact ON chatbot_contact_assignments(contact_id)`); } catch (_) { /* ok */ }

  console.log('✅ Phase 13 migrations complete (LLM model configs + API formats + group settings + contact assignments)');
}
