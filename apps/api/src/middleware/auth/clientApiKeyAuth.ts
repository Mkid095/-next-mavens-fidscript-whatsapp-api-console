import { Request, Response, NextFunction } from 'express';
import db from '../../database.js';
import bcrypt from 'bcryptjs';
import type { Client } from '../../types.js';

/**
 * Validate an external integrator's API key (X-API-Key header or api_key query).
 * Keys live in `client_api_keys` table (format `fidscript_live_<hex>`).
 * After migration they are stored as bcrypt hashes in `key_hash`; legacy keys
 * (key_hash IS NULL) fall back to plaintext compare on `api_key`.
 * On success sets `req.client` and `req.apiKeyId`.
 */
export function clientApiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = (req.headers['x-api-key'] as string | undefined) || (req.query.api_key as string | undefined);

  if (!apiKey) {
    res.status(401).json({ success: false, error: 'X-API-Key header required' });
    return;
  }

  // Fetch key record with client join - keyed by api_key for legacy compat.
  const row = db.prepare(`
    SELECT c.*, k.id AS key_id, k.api_key, k.key_hash AS key_hash
    FROM client_api_keys k
    JOIN clients c ON k.client_id = c.id
    WHERE k.api_key = ? AND k.status = 'Active' AND c.is_active = 1
  `).get(apiKey) as (Client & { key_id: string; api_key: string; key_hash: string | null }) | undefined;

  if (!row) {
    res.status(401).json({ success: false, error: 'Invalid or inactive API key' });
    return;
  }

  // Verify: hash-first, then plaintext fallback for unmigrated legacy rows
  let valid = false;
  if (row.key_hash) {
    valid = bcrypt.compareSync(apiKey, row.key_hash);
  } else {
    // Legacy row without hash - compare plaintext, then upgrade to hash
    valid = row.api_key === apiKey;
    if (valid) {
      const hash = bcrypt.hashSync(apiKey, 10);
      db.prepare('UPDATE client_api_keys SET key_hash = ? WHERE id = ?').run(hash, row.key_id);
    }
  }

  if (!valid) {
    res.status(401).json({ success: false, error: 'Invalid or inactive API key' });
    return;
  }

  const keyId = row.key_id;
  delete (row as { key_id?: string; api_key?: string; key_hash?: string }).key_id;
  delete (row as { api_key?: string }).api_key;
  delete (row as { key_hash?: string }).key_hash;

  req.client = row;
  req.apiKeyId = keyId;

  db.prepare('UPDATE client_api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = ?').run(keyId);

  next();
}