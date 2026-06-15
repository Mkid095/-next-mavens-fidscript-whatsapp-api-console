import { Request, Response, NextFunction } from 'express';
import db from '../../database.js';
import bcrypt from 'bcryptjs';
import type { Client } from '../../types.js';

/**
 * Legacy client auth for routes that use `clients.api_key` directly
 * (not the client_api_keys table). Used by /api/instance/* client JWT
 * endpoints that also accept API key query params for simple integration.
 * After migration keys are stored as bcrypt hashes in `key_hash`; legacy
 * keys fall back to plaintext compare on `api_key`.
 */
export function clientAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string || req.query.api_key as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required. Provide via X-API-Key header or api_key query param',
    });
  }

  const row = db.prepare('SELECT * FROM clients WHERE api_key = ? AND is_active = 1')
    .get(apiKey) as (Client & { key_hash: string | null }) | undefined;

  if (!row) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or inactive API key',
    });
  }

  let valid = false;
  if (row.key_hash) {
    valid = bcrypt.compareSync(apiKey, row.key_hash);
  } else {
    valid = row.api_key === apiKey;
    if (valid) {
      const hash = bcrypt.hashSync(apiKey, 10);
      db.prepare('UPDATE clients SET key_hash = ? WHERE id = ?').run(hash, row.id);
    }
  }

  if (!valid) {
    return res.status(401).json({ success: false, error: 'Invalid or inactive API key' });
  }

  delete (row as { key_hash?: string }).key_hash;
  req.client = row;
  next();
}