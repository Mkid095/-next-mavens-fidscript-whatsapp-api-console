/**
 * Phase 10: Multi-Provider LLM Platform
 *
 * 1. llm_provider_registry  — admin-managed global provider definitions
 * 2. Extend llm_connections — per-workspace connections referencing registry
 *    + is_default, monthly_limit columns
 * 3. Update provider CHECK constraint
 */
import type { Database } from 'sql.js';

export function runPhase10Migrations(db: Database): void {

  // ─── Provider Registry (admin-managed global providers) ───────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS llm_provider_registry (
    id TEXT PRIMARY KEY,
    provider_type TEXT NOT NULL
      CHECK(provider_type IN ('openai','openrouter','anthropic','azure','gemini','ollama','custom')),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    base_url TEXT DEFAULT '',
    auth_type TEXT DEFAULT 'bearer'
      CHECK(auth_type IN ('bearer','api_key','oauth','azure_ad')),
    api_key_encrypted TEXT,
    api_key_last4 TEXT DEFAULT '',
    iv TEXT DEFAULT '',
    auth_tag TEXT DEFAULT '',
    key_version INTEGER DEFAULT 1,
    is_default INTEGER DEFAULT 0,
    is_free_tier INTEGER DEFAULT 0,
    free_quota_tokens INTEGER DEFAULT 0,
    config_json TEXT DEFAULT '{}',
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_provider_registry_type ON llm_provider_registry(provider_type)`); } catch (_) { /* ok */ }

  // ─── Extend llm_connections ──────────────────────────────────────────────────

  // Add new columns (only if they don't exist — sqlite doesn't have ADD COLUMN IF NOT EXISTS
  // so we catch and ignore the error for each column)

  const extraCols = [
    'provider_registry_id TEXT DEFAULT NULL',
    'is_default INTEGER DEFAULT 0',
    'monthly_limit INTEGER DEFAULT 0',
    'monthly_usage INTEGER DEFAULT 0',
    'priority INTEGER DEFAULT 0',
    'extra_headers_json TEXT DEFAULT \'{}\'',
  ];

  for (const colDef of extraCols) {
    const colName = colDef.split(' ')[0];
    try {
      db.run(`ALTER TABLE llm_connections ADD COLUMN ${colDef}`);
    } catch (_) { /* column may already exist */ }
  }

  // Update provider CHECK constraint (sqlite doesn't support DROP CONSTRAINT so we recreate)
  // Since we can't easily modify CHECK, we just add the new types in INSERT/UPDATE logic.
  // The existing rows will have 'byollm' which is still valid.

  // ─── Indexes ────────────────────────────────────────────────────────────────

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_llm_connections_registry ON llm_connections(provider_registry_id)`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_llm_connections_workspace_default ON llm_connections(workspace_id, is_default)`); } catch (_) { /* ok */ }

  // ─── Seed known provider defaults ────────────────────────────────────────────

  try {
    db.run(`INSERT OR IGNORE INTO llm_provider_registry
      (id, provider_type, name, description, base_url, auth_type, is_free_tier, enabled)
      VALUES
      ('prov_gemini', 'gemini', 'Google Gemini', 'Google Gemini 2.0 Flash via Google AI API', 'https://generativelanguage.googleapis.com', 'bearer', 0, 1),
      ('prov_openai', 'openai', 'OpenAI', 'OpenAI GPT models via OpenAI API', 'https://api.openai.com/v1', 'bearer', 0, 1),
      ('prov_openrouter', 'openrouter', 'OpenRouter', 'OpenAI-compatible gateway with free & paid models', 'https://openrouter.ai/api/v1', 'bearer', 1, 1),
      ('prov_anthropic', 'anthropic', 'Anthropic Claude', 'Claude models via Anthropic API', 'https://api.anthropic.com', 'bearer', 0, 1),
      ('prov_azure', 'azure', 'Azure OpenAI', 'Azure-hosted OpenAI models', '', 'azure_ad', 0, 1),
      ('prov_ollama', 'ollama', 'Ollama', 'Local Ollama instance', 'http://localhost:11434/v1', 'bearer', 1, 1)
    `);
  } catch (_) { /* may already exist */ }

  console.log('✅ Phase 10 migrations complete (multi-provider LLM platform)');
}
