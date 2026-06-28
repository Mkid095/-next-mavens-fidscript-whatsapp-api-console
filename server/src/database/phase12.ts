/**
 * Phase 12: Link chatbot_ai_configs to llm_connections
 *
 * Adds llm_connection_id to chatbot_ai_configs so each chatbot can reference
 * a specific workspace LLM connection rather than just storing raw provider/model strings.
 */
import type { Database } from 'sql.js';

export function runPhase12Migrations(db: Database): void {

  // Link chatbot AI config → workspace LLM connection
  try { db.run(`ALTER TABLE chatbot_ai_configs ADD COLUMN llm_connection_id TEXT DEFAULT NULL`); } catch (_) { /* ok */ }

  console.log('✅ Phase 12 migrations complete (chatbot → llm_connection linkage)');
}