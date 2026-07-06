/**
 * Phase 16: Runtime Config Cache + Circuit Breakers + Conversation Locks
 *
 * 1. chatbot_runtime_configs  — write-through cache for compiled bot config
 * 2. chatbot_tool_failures    — per-tool failure log for circuit breaker
 * 3. chatbot_conversation_locks — prevent duplicate processing on rapid messages
 */
import type { Database } from 'sql.js';

export function runPhase16Migrations(db: Database): void {

  // ─── Runtime Config Cache ─────────────────────────────────────────────────
  // Write-through cache: populated on publish, invalidated on next publish.
  // Runtime picks this up before falling back to chatbot_versions.
  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_runtime_configs (
    chatbot_id       TEXT PRIMARY KEY REFERENCES chatbot_configs(id) ON DELETE CASCADE,
    compiled_prompt  TEXT NOT NULL,
    compiled_tools   TEXT NOT NULL,
    compiled_caps    TEXT NOT NULL,
    compiled_version INTEGER NOT NULL,
    cached_at        TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* ok */ }

  // ─── Tool Failure Log ─────────────────────────────────────────────────────
  // Every tool failure is recorded here. After FAILURE_THRESHOLD failures
  // within the last hour, the tool's circuit is opened.
  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_tool_failures (
    id          TEXT PRIMARY KEY,
    tool_id     TEXT NOT NULL,
    chatbot_id  TEXT NOT NULL,
    error       TEXT,
    failed_at   TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_tool_failures_tool ON chatbot_tool_failures(tool_id, failed_at)`); } catch (_) { /* ok */ }

  // ─── Conversation Locks ───────────────────────────────────────────────────
  // INSERT OR IGNORE ensures only one worker processes a conversation at a time.
  // A background cleanup removes stale locks (TTL 30s) in case a worker crashes.
  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_conversation_locks (
    conversation_id TEXT PRIMARY KEY,
    chatbot_id      TEXT NOT NULL,
    locked_at       TEXT DEFAULT CURRENT_TIMESTAMP,
    worker_id       TEXT
  )`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_locks_chatbot ON chatbot_conversation_locks(chatbot_id)`); } catch (_) { /* ok */ }

  console.log('✅ Phase 16 migrations complete (runtime cache, tool failures, conversation locks)');
}
