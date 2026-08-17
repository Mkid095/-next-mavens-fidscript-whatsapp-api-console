/**
 * contactResolver.ts - Canonical Contact Identity Layer
 *
 * Single source of truth for resolving a contact across all identifier types.
 * Every inbound message, Google import, and CSV import goes through here.
 *
 * Resolution order:
 *   1. phone (normalized E.164)          → highest priority, WhatsApp native
 *   2. google_resource (resourceName)   → Google People API person ID
 *   3. email                             → lowest priority
 *
 * If none match → creates a new contact with the first available identifier.
 */

import db from '../database.js';
import { normalizePhone } from '../utils/phone.js';

// ── Types ───────────────────────────────────────────────────────────────────

export type ContactSourceType = 'whatsapp' | 'google' | 'csv' | 'manual' | 'api';
export type IdentifierType = 'phone' | 'email' | 'google_resource';

export interface ResolveResult {
  contactId: string;
  isNew: boolean;
  displayName: string | null;
}

export interface ResolvedContact {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  googleResourceId: string | null;
  sources: ContactSourceType[];
  lastSeenAt: string | null;
}

// ── Core resolver ───────────────────────────────────────────────────────────

/**
 * Canonical contact resolution.
 *
 * @param clientId     - workspace/client id
 * @param phone        - normalized or raw phone (will be normalized)
 * @param googleId     - Google People API resourceName (e.g. "people/xxx")
 * @param email        - email address
 * @param displayName  - display name to use when creating a new contact
 * @param source       - how this contact was introduced (whatsapp|google|csv|manual|api)
 */
export function resolveContact(opts: {
  clientId: string;
  phone?: string | null;
  googleId?: string | null;
  email?: string | null;
  displayName?: string | null;
  source?: ContactSourceType;
}): ResolveResult {
  const {
    clientId,
    phone = null,
    googleId = null,
    email = null,
    displayName = null,
    source = 'whatsapp',
  } = opts;

  // ── Step 1: try phone lookup ────────────────────────────────────────────
  if (phone) {
    const normalized = normalizePhone(phone);
    if (normalized) {
      const byPhone = db.prepare(`
        SELECT ci.contact_id
        FROM contact_identifiers ci
        JOIN contacts c ON c.id = ci.contact_id
        WHERE ci.type = 'phone'
          AND ci.value = ?
          AND c.client_id = ?
        LIMIT 1
      `).get(normalized, clientId) as { contact_id: string } | undefined;

      if (byPhone) {
        // Phone matched - touch last_seen and return
        db.prepare(`UPDATE contacts SET whatsapp_name = COALESCE(NULLIF(whatsapp_name,''), ?) WHERE id = ?`)
          .run(displayName ?? null, byPhone.contact_id);
        return {
          contactId: byPhone.contact_id,
          isNew: false,
          displayName: getContactDisplayName(byPhone.contact_id),
        };
      }
    }
  }

  // ── Step 2: try google resource lookup ──────────────────────────────────
  if (googleId) {
    const byGoogle = db.prepare(`
      SELECT contact_id FROM contact_identifiers
      WHERE type = 'google_resource' AND value = ? LIMIT 1
    `).get(googleId) as { contact_id: string } | undefined;

    if (byGoogle) {
      return {
        contactId: byGoogle.contact_id,
        isNew: false,
        displayName: getContactDisplayName(byGoogle.contact_id),
      };
    }
  }

  // ── Step 3: try email lookup ─────────────────────────────────────────────
  if (email) {
    const byEmail = db.prepare(`
      SELECT contact_id FROM contact_identifiers
      WHERE type = 'email' AND lower(value) = lower(?) LIMIT 1
    `).get(email) as { contact_id: string } | undefined;

    if (byEmail) {
      return {
        contactId: byEmail.contact_id,
        isNew: false,
        displayName: getContactDisplayName(byEmail.contact_id),
      };
    }
  }

  // ── Step 4: no match - create new contact ────────────────────────────────
  const contactId = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const primaryPhone = phone ? (normalizePhone(phone) || phone) : null;

  db.prepare(`
    INSERT INTO contacts (id, client_id, phone, name, whatsapp_name, tags)
    VALUES (?, ?, ?, ?, ?, '')
  `).run(
    contactId,
    clientId,
    primaryPhone ?? '',
    displayName ?? '',
    displayName ?? '',
  );

  // Insert primary phone identifier if available
  if (primaryPhone) {
    upsertContactIdentifier({
      contactId,
      type: 'phone',
      value: primaryPhone,
      isPrimary: true,
    });
  }

  if (googleId) {
    upsertContactIdentifier({ contactId, type: 'google_resource', value: googleId, isPrimary: false });
  }

  if (email) {
    upsertContactIdentifier({ contactId, type: 'email', value: email, isPrimary: false });
  }

  // Record source provenance
  insertContactSource({ contactId, sourceType: source });

  return { contactId, isNew: true, displayName: displayName ?? null };
}

// ── Identifier management ────────────────────────────────────────────────────

export interface UpsertIdentifierOpts {
  contactId: string;
  type: IdentifierType;
  value: string;
  isPrimary: boolean;
}

export function upsertContactIdentifier(opts: UpsertIdentifierOpts): void {
  const { contactId, type, value, isPrimary } = opts;
  db.prepare(`
    INSERT INTO contact_identifiers (id, contact_id, type, value, is_primary, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(contact_id, type, value) DO UPDATE SET is_primary = excluded.is_primary
  `).run(
    `ci_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    contactId,
    type,
    value,
    isPrimary ? 1 : 0,
  );

  // If set as primary, clear primary flag from other identifiers of same type
  if (isPrimary) {
    db.prepare(`
      UPDATE contact_identifiers
      SET is_primary = 0
      WHERE contact_id = ? AND type = ? AND value != ?
    `).run(contactId, type, value);
  }
}

// ── Source management ────────────────────────────────────────────────────────

export function insertContactSource(opts: {
  contactId: string;
  sourceType: ContactSourceType;
  externalId?: string;
  syncStatus?: string;
}): void {
  const { contactId, sourceType, externalId = null, syncStatus = 'active' } = opts;
  db.prepare(`
    INSERT INTO contact_sources (id, contact_id, source_type, external_id, sync_status, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(contact_id, source_type) DO NOTHING
  `).run(
    `cs_${sourceType}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    contactId,
    sourceType,
    externalId,
    syncStatus,
  );
}

export function updateContactSourceSyncStatus(
  contactId: string,
  sourceType: ContactSourceType,
  status: string,
): void {
  db.prepare(`
    UPDATE contact_sources
    SET sync_status = ?, last_synced_at = datetime('now')
    WHERE contact_id = ? AND source_type = ?
  `).run(status, contactId, sourceType);
}

// ── Display name resolution (canonical priority) ─────────────────────────────

/**
 * Returns the best display name for a contact using canonical priority:
 * 1. contacts.name          - manually set name
 * 2. contacts.whatsapp_name - WhatsApp profile name
 * 3. contacts.google_name   - imported from Google
 * 4. phone number           - last resort
 */
export function getContactDisplayName(contactId: string): string | null {
  const row = db.prepare(`
    SELECT phone, name, whatsapp_name, google_name
    FROM contacts WHERE id = ?
  `).get(contactId) as {
    phone: string | null;
    name: string | null;
    whatsapp_name: string | null;
    google_name: string | null;
  } | undefined;

  if (!row) return null;
  if (row.name && row.name.trim()) return row.name.trim();
  if (row.whatsapp_name && row.whatsapp_name.trim()) return row.whatsapp_name.trim();
  if (row.google_name && row.google_name.trim()) return row.google_name.trim();
  if (row.phone) return row.phone;
  return null;
}

/**
 * Returns the WhatsApp name for a contact (used by chat mirror).
 */
export function getWhatsAppName(contactId: string): string | null {
  const row = db.prepare(`SELECT whatsapp_name FROM contacts WHERE id = ?`).get(contactId) as
    | { whatsapp_name: string | null }
    | undefined;
  return row?.whatsapp_name ?? null;
}

// ── Full contact record ─────────────────────────────────────────────────────

export function getContactById(contactId: string): ResolvedContact | null {
  const row = db.prepare(`
    SELECT c.id, c.phone, c.name, c.whatsapp_name, c.google_name, c.created_at,
           ci_phone.value  AS primary_phone,
           ci_email.value  AS primary_email,
           ci_gg.value     AS google_resource_id
    FROM contacts c
    LEFT JOIN contact_identifiers ci_phone ON ci_phone.contact_id = c.id AND ci_phone.type = 'phone'  AND ci_phone.is_primary = 1
    LEFT JOIN contact_identifiers ci_email  ON ci_email.contact_id  = c.id AND ci_email.type  = 'email' AND ci_email.is_primary  = 1
    LEFT JOIN contact_identifiers ci_gg     ON ci_gg.contact_id     = c.id AND ci_gg.type     = 'google_resource'
    WHERE c.id = ?
  `).get(contactId) as {
    id: string;
    phone: string | null;
    name: string | null;
    whatsapp_name: string | null;
    google_name: string | null;
    created_at: string;
    primary_phone: string | null;
    primary_email: string | null;
    google_resource_id: string | null;
  } | undefined;

  if (!row) return null;

  const sources = db.prepare(
    `SELECT source_type FROM contact_sources WHERE contact_id = ?`
  ).all(contactId) as { source_type: ContactSourceType }[];

  const displayName = getContactDisplayName(contactId);

  // Use Google photo if available (avatar_url not stored in contacts table yet)
  const avatarUrl: string | null = null;

  return {
    id: row.id,
    displayName,
    avatarUrl,
    primaryPhone: row.primary_phone ?? row.phone ?? null,
    primaryEmail: row.primary_email ?? null,
    googleResourceId: row.google_resource_id ?? null,
    sources: sources.map(s => s.source_type),
    lastSeenAt: row.created_at,
  };
}

/**
 * Resolve a contact from a raw phone number string.
 * Used by the webhook to canonicalize sender phone before lookup.
 */
export function resolveContactByPhone(
  clientId: string,
  phone: string,
  displayName?: string | null,
  source: ContactSourceType = 'whatsapp',
): ResolveResult {
  return resolveContact({ clientId, phone, displayName, source });
}
