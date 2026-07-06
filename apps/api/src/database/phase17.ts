/**
 * Phase 17: Token Usage Tracking + Forecasting
 *
 * Extends the existing chatbot_token_usage table (created by billing.ts insert).
 * Adds workspace_id for per-workspace aggregation and forecasting queries.
 *
 * The table was created implicitly by billing.ts logTokenUsage() INSERTs.
 * This migration ensures the schema is complete and adds workspace_id.
 */
import type { Database } from 'sql.js';

export function runPhase17Migrations(db: Database): void {
  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_token_usage (
    id               TEXT PRIMARY KEY,
    chatbot_id       TEXT NOT NULL,
    conversation_id  TEXT NOT NULL,
    workspace_id     TEXT NOT NULL,
    model            TEXT,
    prompt_tokens    INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens     INTEGER DEFAULT 0,
    cost_usd         REAL DEFAULT 0,
    cost_units       INTEGER DEFAULT 0,
    period_start     TEXT DEFAULT (datetime('now')),
    created_at       TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* table may already exist */ }

  // Add workspace_id column if not exists (backwards compat with existing rows)
  try { db.run(`ALTER TABLE chatbot_token_usage ADD COLUMN workspace_id TEXT NOT NULL DEFAULT ''`); } catch (_) { /* may already exist */ }

  // Index for fast forecasting queries
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_token_usage_chatbot_date ON chatbot_token_usage(chatbot_id, period_start)`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_token_usage_workspace ON chatbot_token_usage(workspace_id, period_start)`); } catch (_) { /* ok */ }

  console.log('✅ Phase 17 migrations complete (token usage + forecasting)');
}
