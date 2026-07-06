/**
 * Phase 15c: Knowledge Index Versioning
 *
 * Adds index_version to knowledge_sources so each source can have multiple
 * versions (e.g. v1, v2, v3 of a PDF). The chatbot config tracks
 * active_index_version — only sources matching that version are included
 * in the compiled prompt at runtime.
 *
 * This prevents broken searches when a new PDF upload is still being indexed:
 * the old version stays active until the new one is confirmed ready.
 */
import type { Database } from 'sql.js';

export function runPhase15cMigrations(db: Database): void {
  // Per-source version counter — bumped on each re-upload
  try { db.run(`ALTER TABLE chatbot_knowledge ADD COLUMN index_version INTEGER DEFAULT 1`); } catch (_) { /* may already exist */ }

  // Active version for this chatbot — atomically updated on publish
  // All compiled prompts reference sources where source.index_version = this value
  try { db.run(`ALTER TABLE chatbot_configs ADD COLUMN active_index_version INTEGER DEFAULT 1`); } catch (_) { /* may already exist */ }

  console.log('✅ Phase 15c migrations complete (knowledge index versioning)');
}
