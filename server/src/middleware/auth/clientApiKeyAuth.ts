import { Request, Response, NextFunction } from 'express';
import db from '../../database.js';
import type { Client } from '../../types.js';

/**
 * Validate an external integrator's API key (X-API-Key header or api_key query).
 * Keys live in the `client_api_keys` table (format `fidscript_live_<hex>`).
 * On success sets `req.client` (so clientRateLimit + token deduction work) and
 * `req.apiKeyId` (for audit attribution). This is the public /api/v1 auth path.
 */
export function clientApiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = (req.headers['x-api-key'] as string | undefined) || (req.query.api_key as string | undefined);

  if (!apiKey) {
    res.status(401).json({ success: false, error: 'X-API-Key header required' });
    return;
  }

  // Atomic join — single query avoids races with key revocation/deactivation.
  const row = db.prepare(`
    SELECT c.*, k.id AS key_id
    FROM client_api_keys k
    JOIN clients c ON k.client_id = c.id
    WHERE k.api_key = ? AND k.status = 'Active' AND c.is_active = 1
  `).get(apiKey) as (Client & { key_id: string }) | undefined;

  // Identical message for revoked/invalid/inactive — no information leak.
  if (!row) {
    res.status(401).json({ success: false, error: 'Invalid or inactive API key' });
    return;
  }

  const keyId = row.key_id;
  delete (row as { key_id?: string }).key_id;

  req.client = row;
  req.apiKeyId = keyId;

  // Fire-and-forget: never block auth on the last_used write.
  db.prepare('UPDATE client_api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = ?').run(keyId);

  next();
}
