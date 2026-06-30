/**
 * Phase 22 — Conversation Assignments
 *
 * New table:
 *   conversation_assignments — full history of user/team assignments per conversation
 *     Supports assign, transfer (re-assign), release workflow.
 *     Maintains audit trail: who assigned whom, when, with what notes.
 *
 * Indexes on (conversation_id, status) and (user_id, status) for fast lookups.
 */

import type { Database } from 'sql.js';

export function runPhase22Migrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS conversation_assignments (
      id              TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      user_id         TEXT,      -- null if team assignment
      team_id         TEXT,     -- null if user assignment
      assigned_by     TEXT,      -- user_id who made the assignment
      status          TEXT DEFAULT 'active',  -- active | released | transferred | closed
      assigned_at     TEXT DEFAULT (datetime('now')),
      released_at     TEXT,
      notes           TEXT
    )
  `);

  // Fast lookup by conversation + status (used for active assignment checks)
  db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_conv ON conversation_assignments(conversation_id, status)`);

  // Fast lookup by user + status (used for "my conversations" query)
  db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_user ON conversation_assignments(user_id, status)`);
}
