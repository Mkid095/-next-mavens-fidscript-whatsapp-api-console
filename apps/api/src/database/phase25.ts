import type { Database } from 'sql.js';

/**
 * Phase 25: Chatbot Handoff Notification Configuration
 *
 * Stores per-workspace handoff notification destinations so agents actually get
 * paged when a chatbot escalates to a human.
 *
 * notification_type: 'webhook' | 'email'
 * For webhook:  target_url is the endpoint (Slack incoming webhook, custom, etc.)
 * For email:   target_url is the SMTP webhook URL (or email address stored here directly)
 */

export function runPhase25Migrations(db: Database): void {
  try {
    db.run(`CREATE TABLE IF NOT EXISTS chatbot_handoff_config (
      id                TEXT PRIMARY KEY,
      workspace_id      TEXT NOT NULL,
      chatbot_id        TEXT,
      notification_type TEXT NOT NULL CHECK(notification_type IN ('webhook','email'))
        DEFAULT 'webhook',
      target_url        TEXT NOT NULL,
      enabled           INTEGER NOT NULL DEFAULT 1,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(workspace_id, chatbot_id, notification_type)
    )`);
  } catch (_) { /* ok */ }

  try { db.run(`CREATE INDEX IF NOT EXISTS idx_handoff_config_ws    ON chatbot_handoff_config(workspace_id)`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_handoff_config_chat  ON chatbot_handoff_config(chatbot_id)`); } catch (_) { /* ok */ }

  console.log('✅ Phase 25 migrations complete (chatbot handoff notification config)');
}
