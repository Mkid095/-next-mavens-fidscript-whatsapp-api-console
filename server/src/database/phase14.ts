/**
 * Phase 14: Draft Autosave + Publish Pipeline + Runtime Artifacts
 *
 * 1. chatbot_drafts          — per-workspace draft autosave
 * 2. chatbot_publish_jobs    — async publish pipeline job tracking
 * 3. chatbot_versions        — extend with compiled runtime artifacts
 */
import type { Database } from 'sql.js';

export function runPhase14Migrations(db: Database): void {

  // ─── Draft Autosave Table ───────────────────────────────────────────────────
  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_drafts (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    chatbot_id TEXT,
    draft_json TEXT NOT NULL,
    last_step TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_drafts_workspace ON chatbot_drafts(workspace_id)`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_drafts_chatbot ON chatbot_drafts(chatbot_id)`); } catch (_) { /* ok */ }

  // ─── Publish Pipeline Job Table ─────────────────────────────────────────────
  // Status: pending → building → indexing → compiling → activating → done | failed
  try { db.run(`CREATE TABLE IF NOT EXISTS chatbot_publish_jobs (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending','building','indexing','compiling','activating','done','failed')),
    progress INTEGER NOT NULL DEFAULT 0,
    current_step TEXT,
    message TEXT,
    error TEXT,
    result_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES clients(id) ON DELETE CASCADE
  )`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_publish_jobs_chatbot ON chatbot_publish_jobs(chatbot_id)`); } catch (_) { /* ok */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_publish_jobs_workspace ON chatbot_publish_jobs(workspace_id)`); } catch (_) { /* ok */ }

  // ─── Extend chatbot_versions with runtime artifacts ─────────────────────────
  try { db.run(`ALTER TABLE chatbot_versions ADD COLUMN compiled_prompt TEXT`); } catch (_) { /* may already exist */ }
  try { db.run(`ALTER TABLE chatbot_versions ADD COLUMN compiled_tools TEXT`); } catch (_) { /* ok */ }
  try { db.run(`ALTER TABLE chatbot_versions ADD COLUMN compiled_capabilities TEXT`); } catch (_) { /* ok */ }
  try { db.run(`ALTER TABLE chatbot_versions ADD COLUMN change_summary TEXT`); } catch (_) { /* may already exist in phase9 */ }

  console.log('✅ Phase 14 migrations complete (drafts, publish jobs, runtime artifacts)');
}
