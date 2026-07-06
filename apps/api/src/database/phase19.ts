/**
 * Phase 19: Human Takeover Mode
 *
 * Allows an agent to manually take over a conversation from the AI,
 * and later resume AI control. The worker checks overrides before processing.
 *
 * 1. chatbot_conversation_overrides — per-conversation AI/manual override
 */
import type { Database } from 'sql.js';

export function runPhase19Migrations(db: Database): void {
  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_conversation_overrides (
    conversation_id  TEXT PRIMARY KEY,
    chatbot_id       TEXT NOT NULL,
    mode             TEXT NOT NULL CHECK(mode IN ('manual','ai')),
    overridden_by    TEXT,
    overridden_at    TEXT DEFAULT CURRENT_TIMESTAMP,
    note             TEXT
  )`); } catch (_) { /* ok */ }

  console.log('✅ Phase 19 migrations complete (human takeover mode)');
}
