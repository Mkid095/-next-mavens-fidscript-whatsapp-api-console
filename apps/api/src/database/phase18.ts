/**
 * Phase 18: Runtime Traces + AI Response Explainability
 *
 * 1. chatbot_traces — step-level execution traces per conversation
 * 2. chatbot_response_metadata — per-message AI response explainability
 */
import type { Database } from 'sql.js';

export function runPhase18Migrations(db: Database): void {

  // ─── Runtime Traces ────────────────────────────────────────────────────────
  // Records each step in the message processing pipeline with duration and metadata.
  // Useful for debugging, performance tuning, and understanding bot behaviour.
  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_traces (
    id               TEXT PRIMARY KEY,
    conversation_id  TEXT NOT NULL,
    chatbot_id       TEXT NOT NULL,
    workspace_id     TEXT NOT NULL,
    step             TEXT NOT NULL,
    duration_ms      INTEGER NOT NULL,
    metadata         TEXT,
    created_at       TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_traces_conversation ON chatbot_traces(conversation_id)`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_traces_chatbot ON chatbot_traces(chatbot_id)`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_traces_created ON chatbot_traces(created_at DESC)`); } catch (_) { /* ok */ }

  // ─── AI Response Explainability ────────────────────────────────────────────
  // Stores what the AI used to generate each response: sources, tools, confidence.
  // Joined to inbox_messages.id to surface in the inbox UI.
  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_response_metadata (
    id              TEXT PRIMARY KEY,
    message_id      TEXT NOT NULL,
    chatbot_id      TEXT NOT NULL,
    sources         TEXT,
    tools           TEXT,
    confidence      REAL,
    model           TEXT,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
  )`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_resp_meta_message ON chatbot_response_metadata(message_id)`); } catch (_) { /* ok */ }

  console.log('✅ Phase 18 migrations complete (runtime traces, AI response metadata)');
}
