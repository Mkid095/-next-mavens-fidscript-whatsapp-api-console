/**
 * phase27.ts — tool security columns: approved + requires_confirmation.
 *
 * Generated tools start as approved=0 (need explicit approval before
 * the chatbot can use them). Dangerous tools (DELETE/refund/cancel)
 * get requires_confirmation=1.
 */
import type { Database as SqlJsDatabase } from 'sql.js';

export function runPhase27Migrations(db: SqlJsDatabase): void {
  // Add columns if they don't exist (safe with try/catch — ALTER TABLE
  // ADD COLUMN errors if the column is already present)
  const addColumnIfMissing = (table: string, col: string, def: string): void => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
    } catch {
      // Column already exists — expected on re-run
    }
  };

  addColumnIfMissing('tools', 'approved', 'INTEGER NOT NULL DEFAULT 1');
  addColumnIfMissing('tools', 'requires_confirmation', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('tools', 'generator_version', 'TEXT');
  addColumnIfMissing('tools', 'generated_hash', 'TEXT');

  // Mark all demo/builtin tools as approved (they're safe, pre-configured)
  try {
    db.exec(`UPDATE tools SET approved = 1 WHERE data_source_id IN (SELECT id FROM data_sources WHERE is_builtin = 1)`);
  } catch {
    // tools table may not exist yet if phase26 hasn't run
  }
}