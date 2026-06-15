import type { Database } from 'sql.js';

// =============================================================================
// Phase 3 migrations — customer_assignments + SLA columns on conversations.
// Guarded ALTERs follow the same pattern as workspace/migrations.ts (P9:
// reserve the seam, ship the slice).
// =============================================================================

export function runPhase3Migrations(db: Database): void {
  // customer_assignments: per-customer owner (user or team). Distinct from
  // conversation-level assignee: a customer may have a long-term account
  // owner even when their current conversation is unassigned.
  db.run(`
    CREATE TABLE IF NOT EXISTS customer_assignments (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      owner_user_id TEXT,
      team_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(customer_id)
    )
  `);

  // SLA timing columns on conversations. Policies are in sla_policies (§9.2).
  try { db.run('ALTER TABLE conversations ADD COLUMN sla_policy_id TEXT'); } catch (_) { /* ok */ }
  try { db.run('ALTER TABLE conversations ADD COLUMN first_response_at TEXT'); } catch (_) { /* ok */ }
  try { db.run('ALTER TABLE conversations ADD COLUMN resolved_at TEXT'); } catch (_) { /* ok */ }
  try { db.run('ALTER TABLE conversations ADD COLUMN response_due_at TEXT'); } catch (_) { /* ok */ }
  try { db.run('ALTER TABLE conversations ADD COLUMN resolution_due_at TEXT'); } catch (_) { /* ok */ }
  try { db.run('ALTER TABLE conversations ADD COLUMN breached_at TEXT'); } catch (_) { /* ok */ }

  // Indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_assignments_customer ON customer_assignments(customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sla_policies_ws ON sla_policies(workspace_id)`);
}
