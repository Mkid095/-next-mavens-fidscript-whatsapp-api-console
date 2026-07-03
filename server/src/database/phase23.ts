import type { Database as SqlJsDatabase } from 'sql.js';

/**
 * Phase 23: Contact Identity Layer
 *
 * Tables:
 * - contact_identifiers  — canonical phone/email/google link per contact
 * - contact_sources       — tracking sheet for where each contact came from
 *
 * Backfills:
 * - Every existing contact gets a `phone` identifier and a `whatsapp` source entry
 */

export function runPhase23Migrations(db: SqlJsDatabase): void {
  // ── contact_identifiers ────────────────────────────────────────────────────
  // One row per (contact, type, value) tuple.
  // type: 'phone' | 'email' | 'google_resource'
  // is_primary: only one primary identifier per contact per type (enforced by app logic)
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_identifiers (
      id          TEXT PRIMARY KEY,
      contact_id  TEXT NOT NULL,
      type        TEXT NOT NULL CHECK(type IN ('phone','email','google_resource')),
      value       TEXT NOT NULL,
      is_primary  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(contact_id, type, value)
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_ci_contact_id  ON contact_identifiers(contact_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ci_type_value  ON contact_identifiers(type, value)`);

  // ── contact_sources ───────────────────────────────────────────────────────
  // Tracks the provenance of a contact and the sync state of each source.
  // One row per (contact, source_type) pair.
  // source_type: 'whatsapp' | 'google' | 'csv' | 'manual' | 'api'
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_sources (
      id                  TEXT PRIMARY KEY,
      contact_id          TEXT NOT NULL,
      source_type         TEXT NOT NULL CHECK(source_type IN ('whatsapp','google','csv','manual','api')),
      external_id         TEXT,
      sync_status         TEXT NOT NULL DEFAULT 'active'
                                CHECK(sync_status IN ('active','syncing','error','expired')),
      last_synced_at      TEXT,
      metadata            TEXT,
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(contact_id, source_type)
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_cs_contact_id    ON contact_sources(contact_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cs_source_status ON contact_sources(source_type, sync_status)`);

  // ── Backfill: add primary phone identifier for every existing contact ──────
  // Only insert rows that don't already have a phone identifier.
  const existingContacts = db.exec(`
    SELECT c.id, c.phone, c.client_id
    FROM contacts c
    WHERE c.phone IS NOT NULL AND c.phone != ''
    AND NOT EXISTS (
      SELECT 1 FROM contact_identifiers ci
      WHERE ci.contact_id = c.id AND ci.type = 'phone'
    )
  `);

  if (existingContacts.length > 0 && existingContacts[0].values.length > 0) {
    const now = new Date().toISOString();
    for (const row of existingContacts[0].values) {
      const [contactId, phone] = row as [string, string];
      db.run(
        `INSERT OR IGNORE INTO contact_identifiers (id, contact_id, type, value, is_primary, created_at)
         VALUES (?, ?, 'phone', ?, 1, ?)`,
        [`ci_phone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, contactId, phone, now],
      );
    }
  }

  // ── Backfill: add whatsapp source entry for every existing contact ───────
  const existingSources = db.exec(`
    SELECT c.id
    FROM contacts c
    WHERE NOT EXISTS (
      SELECT 1 FROM contact_sources cs
      WHERE cs.contact_id = c.id AND cs.source_type = 'whatsapp'
    )
  `);

  if (existingSources.length > 0 && existingSources[0].values.length > 0) {
    const now = new Date().toISOString();
    for (const row of existingSources[0].values) {
      const [contactId] = row as [string];
      db.run(
        `INSERT OR IGNORE INTO contact_sources (id, contact_id, source_type, sync_status, created_at)
         VALUES (?, ?, 'whatsapp', 'active', ?)`,
        [`cs_wa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, contactId, now],
      );
    }
  }
}
