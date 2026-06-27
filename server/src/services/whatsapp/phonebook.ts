/**
 * WhatsApp phonebook sync — pulls the account's contact list from the gateway
 * and upserts it into the main `contacts` table with the instance_id flag.
 *
 * Rules:
 *   - Manual contacts (instance_id NULL) are authoritative — never overwritten.
 *   - Synced contacts (instance_id set) are deleted on disconnect / on next
 *     sync if they no longer appear in the phonebook.
 *   - The synced name is the WhatsApp pushName (or name/verifiedName fallback),
 *     which is exactly what WhatsApp Web displays.
 */

import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { normalizePhone } from '../../utils/phone.js';
import { findContacts } from './chats.js';
import { type SendContext, gatewayNameOf } from './shared.js';
import { paceWhatsAppCall } from './whatsappCallLimiter.js';
import type { Instance } from '../../types.js';

type Rec = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const rec = (v: unknown): Rec | null => (v && typeof v === 'object' ? (v as Rec) : null);

function arrOf(data: unknown, keys: string[]): unknown[] {
  const root = rec(data);
  if (Array.isArray(data)) return data;
  if (!root) return [];
  for (const k of keys) { const v = root[k]; if (Array.isArray(v)) return v; }
  return [];
}

/** Pull a displayable name + a phone (digits) out of a Baileys contact entry. */
function readNameAndPhone(entry: Rec): { name: string | null; phone: string | null } {
  const name = str(entry.pushName) || str(entry.name) || str(entry.verifiedName) || str(entry.businessName) || null;
  const phone = str(entry.phoneNumber) || str(entry.number);
  if (phone) return { name, phone };
  // Many the gateway responses embed the JID in `id` or `remoteJid`.
  const jid = str(entry.id) || str(entry.remoteJid) || str(entry.jid);
  if (jid.includes('@')) return { name, phone: jid.split('@')[0] };
  return { name, phone: null };
}

/**
 * Sync the WhatsApp phonebook for a connected instance into `contacts`.
 * Returns counts so the UI can show "Synced N contacts (M removed)".
 */
export async function syncPhonebookForInstance(
  instance: Instance & { client_id: string },
  clientId: string,
): Promise<{ synced: number; removed: number; error?: string }> {
  const ctx: SendContext = {
    instance,
    client: { id: clientId } as SendContext['client'],
    req: { headers: {} } as SendContext['req'],
  };

  await paceWhatsAppCall(instance.id); // pace the gateway→WhatsApp
  const result = await findContacts(ctx);
  if (!result.ok) return { synced: 0, removed: 0, error: result.error };

  const raw = arrOf(result.data, ['response', 'contacts', 'data']);
  const syncedPhones: string[] = [];
  let synced = 0;

  const selectRow = db.prepare('SELECT id, instance_id FROM contacts WHERE client_id = ? AND phone = ?');
  const insert = db.prepare(
    `INSERT INTO contacts (id, client_id, phone, name, instance_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const update = db.prepare('UPDATE contacts SET name = ?, instance_id = ? WHERE id = ?');
  const deleteSyncedDup = db.prepare(
    'DELETE FROM contacts WHERE client_id = ? AND phone = ? AND instance_id IS NOT NULL'
  );
  const countStmt = db.prepare(
    'SELECT COUNT(*) as c FROM contacts WHERE client_id = ? AND instance_id = ?'
  );

  // sql.js has no JS-level .transaction(); each statement is atomic and a
  // partial sync is self-healing on the next run (stale phones get cleaned).
  for (const entry of raw) {
    const item = rec(entry);
    if (!item) continue;
    const { name, phone } = readNameAndPhone(item);
    if (!phone || !name) continue;
    const normalized = normalizePhone(phone);
    if (!normalized) continue;
    syncedPhones.push(normalized);

    const existing = selectRow.get(clientId, normalized) as { id: string; instance_id: string | null } | undefined;
    try {
      if (existing) {
        if (existing.instance_id === null) {
          // Manual contact wins — drop any stale synced duplicate.
          deleteSyncedDup.run(clientId, normalized);
        } else {
          update.run(name, instance.id, existing.id);
          synced++;
        }
      } else {
        insert.run(
          `pb_${uuidv4().slice(0, 12)}`, clientId, normalized, name, instance.id, new Date().toISOString()
        );
        synced++;
      }
    } catch (err) {
      console.error('[phonebook] upsert failed for', normalized, err);
    }
  }

  // Remove synced contacts for this instance that disappeared from the phonebook.
  const before = (countStmt.get(clientId, instance.id) as { c: number }).c;
  try {
    if (syncedPhones.length === 0) {
      db.prepare('DELETE FROM contacts WHERE client_id = ? AND instance_id = ?').run(clientId, instance.id);
    } else {
      const placeholders = syncedPhones.map(() => '?').join(',');
      db.prepare(
        `DELETE FROM contacts WHERE client_id = ? AND instance_id = ? AND phone NOT IN (${placeholders})`
      ).run(clientId, instance.id, ...syncedPhones);
    }
  } catch (err) {
    console.error('[phonebook] stale cleanup failed:', err);
  }
  const after = (countStmt.get(clientId, instance.id) as { c: number }).c;
  const removed = Math.max(0, before - after);
  return { synced, removed };
}

/**
 * Remove all WhatsApp-synced contacts for an instance. Called when the
 * instance disconnects, is logged out, or is deleted. Manual contacts
 * (instance_id NULL) are never touched.
 */
export function cleanupPhonebookForInstance(instanceId: string | number, clientId: string): number {
  const result = db.prepare(
    'DELETE FROM contacts WHERE client_id = ? AND instance_id = ?'
  ).run(clientId, String(instanceId));
  return result.changes;
}