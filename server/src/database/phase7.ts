import type { Database } from 'sql.js';

// =============================================================================
// Phase 7 migrations — P11 airtight workspace isolation.
//
//   - Add workspace_id to child tables (customer_tags, customer_notes,
//     customer_assignments) so defense-in-depth scoping is possible at
//     the SQL layer, not just at the route's ownedCustomer() check.
//   - Backfill from customers.workspace_id so existing rows are coherent.
//   - Index the new columns for query performance.
//
// Without workspace_id on these tables, a child-table query that omits the
// upstream ownedCustomer() check leaks cross-tenant data. The route-layer
// check is brittle; the column-level check is enforceable by helper.
// =============================================================================

function columnExists(db: Database, table: string, column: string): boolean {
  const stmt = db.prepare(`PRAGMA table_info(${table})`);
  const rows: { name: string }[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as { name: string });
  stmt.free();
  return rows.some(r => r.name === column);
}

export function runPhase7Migrations(db: Database): void {
  // --- customer_tags --------------------------------------------------------
  if (!columnExists(db, 'customer_tags', 'workspace_id')) {
    db.run('ALTER TABLE customer_tags ADD COLUMN workspace_id TEXT');
    db.run(`
      UPDATE customer_tags
      SET workspace_id = (SELECT workspace_id FROM customers WHERE customers.id = customer_tags.customer_id)
      WHERE workspace_id IS NULL
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_customer_tags_workspace ON customer_tags(workspace_id)');
  }

  // --- customer_notes -------------------------------------------------------
  if (!columnExists(db, 'customer_notes', 'workspace_id')) {
    db.run('ALTER TABLE customer_notes ADD COLUMN workspace_id TEXT');
    db.run(`
      UPDATE customer_notes
      SET workspace_id = (SELECT workspace_id FROM customers WHERE customers.id = customer_notes.customer_id)
      WHERE workspace_id IS NULL
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_customer_notes_workspace ON customer_notes(workspace_id)');
  }

  // --- customer_assignments -------------------------------------------------
  if (!columnExists(db, 'customer_assignments', 'workspace_id')) {
    db.run('ALTER TABLE customer_assignments ADD COLUMN workspace_id TEXT');
    db.run(`
      UPDATE customer_assignments
      SET workspace_id = (SELECT workspace_id FROM customers WHERE customers.id = customer_assignments.customer_id)
      WHERE workspace_id IS NULL
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_customer_assignments_workspace ON customer_assignments(workspace_id)');
  }

  // --- customer_identifiers --------------------------------------------------
  if (!columnExists(db, 'customer_identifiers', 'workspace_id')) {
    db.run('ALTER TABLE customer_identifiers ADD COLUMN workspace_id TEXT');
    db.run(`
      UPDATE customer_identifiers
      SET workspace_id = (SELECT workspace_id FROM customers WHERE customers.id = customer_identifiers.customer_id)
      WHERE workspace_id IS NULL
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_customer_identifiers_workspace ON customer_identifiers(workspace_id)');
  }
}
