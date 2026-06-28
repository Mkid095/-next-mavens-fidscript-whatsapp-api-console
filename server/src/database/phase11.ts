/**
 * Phase 11: LLM Runtime Contracts
 *
 * 1. llm_fallback_chain    — ordered failover chains per workspace
 * 2. llm_provider_models   — per-provider model registry (context_length,
 *                             capabilities, latency class)
 * 3. Index on llm_fallback_chain for fast lookup
 */
import type { Database } from 'sql.js';

export function runPhase11Migrations(db: Database): void {

  // ─── Fallback Chains ─────────────────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS llm_fallback_chain (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Default',
    chain_json TEXT NOT NULL DEFAULT '[]',
    is_default INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_fallback_chain_workspace
    ON llm_fallback_chain(workspace_id, is_default)`); } catch (_) { /* ok */ }

  // ─── Per-Provider Model Registry ─────────────────────────────────────────────

  try { db.run(`CREATE TABLE IF NOT EXISTS llm_provider_models (
    id TEXT PRIMARY KEY,
    provider_registry_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    context_length INTEGER DEFAULT 4096,
    supports_tools INTEGER DEFAULT 0,
    supports_json_mode INTEGER DEFAULT 0,
    latency_class TEXT DEFAULT 'medium'
      CHECK(latency_class IN ('fast','medium','slow')),
    cost_per_1k_input_tokens REAL DEFAULT 0,
    cost_per_1k_output_tokens REAL DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_registry_id) REFERENCES llm_provider_registry(id) ON DELETE CASCADE,
    UNIQUE(provider_registry_id, model_id)
  )`); } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_provider_models_registry
    ON llm_provider_models(provider_registry_id)`); } catch (_) { /* ok */ }

  console.log('✅ Phase 11 migrations complete (LLM runtime contracts)');
}