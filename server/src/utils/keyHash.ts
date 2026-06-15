import bcrypt from 'bcryptjs';
import db from '../database.js';

const SALT_ROUNDS = 10;

/** Hash an API key with bcrypt. */
export async function hashKey(key: string): Promise<string> {
  return bcrypt.hash(key, SALT_ROUNDS);
}

/** Verify an API key against a bcrypt hash. Falls back to plaintext compare
 *  when hash is null (legacy un-migrated keys). */
export function verifyKey(key: string, hash: string | null): boolean {
  if (!key) return false;
  if (hash) return bcrypt.compareSync(key, hash);
  return false; // no hash means legacy row — auth middleware handles plaintext fallback
}

/** Backfill key_hash for any rows that don't have one yet. Call on startup. */
export function migrateKeyHashes(): number {
  let migrated = 0;

  // Migrate clients table
  const clients = db.prepare('SELECT id, api_key, key_hash FROM clients WHERE key_hash IS NULL').all() as Array<{ id: string; api_key: string }>;
  for (const c of clients) {
    if (c.api_key) {
      const h = bcrypt.hashSync(c.api_key, SALT_ROUNDS);
      db.prepare('UPDATE clients SET key_hash = ? WHERE id = ?').run(h, c.id);
      migrated++;
    }
  }

  // Migrate client_api_keys table
  const keys = db.prepare('SELECT id, api_key, key_hash FROM client_api_keys WHERE key_hash IS NULL').all() as Array<{ id: string; api_key: string }>;
  for (const k of keys) {
    if (k.api_key) {
      const h = bcrypt.hashSync(k.api_key, SALT_ROUNDS);
      db.prepare('UPDATE client_api_keys SET key_hash = ? WHERE id = ?').run(h, k.id);
      migrated++;
    }
  }

  return migrated;
}

/** Store hash alongside plaintext key (dual-write for backward compat during migration). */
export function storeHashedKey(table: 'clients' | 'client_api_keys', keyId: string, key: string): void {
  const hash = bcrypt.hashSync(key, SALT_ROUNDS);
  db.prepare(`UPDATE ${table} SET key_hash = ? WHERE id = ?`).run(hash, keyId);
}