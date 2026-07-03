import type { Database } from 'sql.js';

/**
 * Phase 24: Group respond_mode column for chatbot_group_settings
 *
 * Adds respond_mode to chatbot_group_settings so per-group routing modes can be
 * stored: 'mention_only' | 'keyword_trigger' | 'admin_only' | 'disabled' | 'allow_all'.
 * Also adds group_jid as the routing key (unique per chatbot).
 */

export function runPhase24Migrations(db: Database): void {
  // Add group_jid column (the routing key for per-group settings)
  try {
    db.run(`ALTER TABLE chatbot_group_settings ADD COLUMN group_jid TEXT`);
  } catch (_) { /* may already exist */ }

  // Add respond_mode column
  try {
    db.run(`ALTER TABLE chatbot_group_settings ADD COLUMN respond_mode TEXT NOT NULL DEFAULT 'allow_all'
      CHECK(respond_mode IN ('mention_only','keyword_trigger','admin_only','disabled','allow_all'))`);
  } catch (_) { /* may already exist */ }

  // Unique constraint on (chatbot_id, group_jid) so one row per bot×group
  try {
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_group_settings_unique
      ON chatbot_group_settings(chatbot_id, group_jid)`);
  } catch (_) { /* index may already exist */ }

  console.log('✅ Phase 24 migrations complete (chatbot_group_settings respond_mode + group_jid)');
}
