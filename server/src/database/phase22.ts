/**
 * Phase 22 — Conversation Assignments
 *
 * The conversation_assignments table may already exist from a prior partial migration.
 * We use ALTER TABLE ADD COLUMN (not CREATE TABLE) to add any missing columns
 * without disturbing existing data.
 *
 * Existing schema may have: id, conversation_id, agent_id, agent_name,
 *                          team_id, assigned_at, released_at, reason
 *
 * New columns added: user_id, assigned_by, status, notes
 */

import type { Database } from 'sql.js';

export function runPhase22Migrations(db: Database): void {
  // Add missing columns to the existing conversation_assignments table.
  // Uses try/catch per column so this is idempotent — works whether or not
  // the table exists and whether or not individual columns exist.
  const cols: Array<[string, string]> = [
    ["user_id",      "TEXT"],
    ["assigned_by",  "TEXT"],
    ["status",       "TEXT DEFAULT 'active'"],
    ["notes",        "TEXT"],
  ];

  for (const [name, def] of cols) {
    try { db.run(`ALTER TABLE conversation_assignments ADD COLUMN ${name} ${def}`); } catch (_) { /* already exists */ }
  }

  // Indexes for fast conversation + user lookups
  try { db.run(`CREATE INDEX idx_assignments_conv ON conversation_assignments(conversation_id, status)`); } catch (_) { /* already exists */ }
  try { db.run(`CREATE INDEX idx_assignments_user ON conversation_assignments(user_id, status)`); } catch (_) { /* already exists */ }
}
