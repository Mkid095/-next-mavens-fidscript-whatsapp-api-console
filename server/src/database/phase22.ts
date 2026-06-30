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
  // Create the table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS conversation_assignments (
      id              TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      user_id         TEXT,
      team_id         TEXT,
      assigned_by     TEXT,
      status          TEXT DEFAULT 'active',
      assigned_at     TEXT DEFAULT (datetime('now')),
      released_at     TEXT,
      notes           TEXT
    )
  `);

  // Add missing columns to an existing table that may have been created without them
  try { db.run("ALTER TABLE conversation_assignments ADD COLUMN user_id TEXT"); } catch (_) { /* already exists */ }
  try { db.run("ALTER TABLE conversation_assignments ADD COLUMN team_id TEXT"); } catch (_) { /* already exists */ }
  try { db.run("ALTER TABLE conversation_assignments ADD COLUMN assigned_by TEXT"); } catch (_) { /* already exists */ }
  try { db.run("ALTER TABLE conversation_assignments ADD COLUMN status TEXT DEFAULT 'active'"); } catch (_) { /* already exists */ }
  try { db.run("ALTER TABLE conversation_assignments ADD COLUMN assigned_at TEXT DEFAULT (datetime('now'))"); } catch (_) { /* already exists */ }
  try { db.run("ALTER TABLE conversation_assignments ADD COLUMN released_at TEXT"); } catch (_) { /* already exists */ }
  try { db.run("ALTER TABLE conversation_assignments ADD COLUMN notes TEXT"); } catch (_) { /* already exists */ }

  // Fast lookup indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_conv ON conversation_assignments(conversation_id, status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_user ON conversation_assignments(user_id, status)`);
}
