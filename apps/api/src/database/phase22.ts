/**
 * Phase 22.1 — Cleanup duplicate columns + enforce single active assignment
 *
 * The conversation_assignments table has accumulated duplicate columns over time:
 *   agent_id  — original, NOT NULL constraint prevents backfill
 *   user_id   — added later, nullable but empty for existing rows
 *   agent_name — redundant (exists in users table)
 *
 * This phase:
 *   1. Backfill user_id = agent_id where user_id IS NULL
 *   2. Drop NOT NULL constraint on agent_id (we'll keep it as a nullable alias)
 *   3. Drop the redundant agent_name column
 *   4. Add a partial unique index: only one 'active' assignment per conversation
 */

import type { Database } from 'sql.js';

export function runPhase22Migrations(db: Database): void {
  // Step 1: Backfill user_id from agent_id for rows where user_id is null
  try { db.run(`UPDATE conversation_assignments SET user_id = agent_id WHERE user_id IS NULL AND agent_id IS NOT NULL`); } catch (_) { /* ok */ }

  // Step 2: Drop the redundant agent_name column (data is denormalized anyway)
  try { db.run(`ALTER TABLE conversation_assignments DROP COLUMN agent_name`); } catch (_) { /* may fail on some SQLite versions — skip */ }

  // Step 3: Remove the NOT NULL constraint on agent_id by recreating the column
  // SQLite doesn't support DROP COLUMN on agent_id directly (NOT NULL), so we
  // rebuild the table schema cleanly.
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS conversation_assignments_clean (
        id              TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        user_id         TEXT,
        team_id         TEXT,
        assigned_by     TEXT,
        status          TEXT DEFAULT 'active',
        assigned_at     TEXT DEFAULT CURRENT_TIMESTAMP,
        released_at     TEXT,
        notes           TEXT,
        reason          TEXT DEFAULT '',
        agent_id        TEXT
      )
    `);
    db.run(`
      INSERT OR IGNORE INTO conversation_assignments_clean
        (id, conversation_id, user_id, team_id, assigned_by, status, assigned_at, released_at, notes, reason, agent_id)
      SELECT id, conversation_id, user_id, team_id, assigned_by, status, assigned_at, released_at, notes, reason, agent_id
      FROM conversation_assignments
    `);
    db.run(`DROP TABLE conversation_assignments`);
    db.run(`ALTER TABLE conversation_assignments_clean RENAME TO conversation_assignments`);
  } catch (_) { /* table may not have agent_name or other issues — skip */ }

  // Step 4: Add missing columns that may not exist on existing deployments
  const cols: Array<[string, string]> = [
    ["user_id",     "TEXT"],
    ["assigned_by", "TEXT"],
    ["status",      "TEXT DEFAULT 'active'"],
    ["notes",       "TEXT"],
  ];
  for (const [name, def] of cols) {
    try { db.run(`ALTER TABLE conversation_assignments ADD COLUMN ${name} ${def}`); } catch (_) { /* already exists */ }
  }

  // Step 5: Add assignee_type column if missing (user | team | bot | queue)
  try { db.run(`ALTER TABLE conversation_assignments ADD COLUMN assignee_type TEXT DEFAULT 'user'`); } catch (_) { /* already exists */ }

  // Step 6: Partial unique index — only one active assignment per conversation
  // SQLite uses a filtered index syntax; alternatively enforce via application logic
  try {
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_single_active
            ON conversation_assignments(conversation_id)
            WHERE status = 'active'`);
  } catch (_) { /* filtered indexes may not be supported in all SQLite versions */ }

  // Step 6: Indexes for fast lookups
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_conv ON conversation_assignments(conversation_id, status)`); } catch (_) { /* already exists */ }
  try { db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_user ON conversation_assignments(user_id, status)`); } catch (_) { /* already exists */ }
}
