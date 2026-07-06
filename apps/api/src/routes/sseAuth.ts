/**
 * sseAuth.ts — SSE authentication helper
 */
import type { Request } from 'express';
import db from '../database.js';
import { verifyToken } from '../middleware/auth/jwt.js';
import type { Client } from '../types.js';

export function authSseToken(req: Request): { decoded: ReturnType<typeof verifyToken>; client: Client } | null {
  const token = req.query.token as string;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'client') return null;

  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND is_active = 1').get(decoded.id) as Client | undefined;
  if (!client) return null;

  return { decoded, client };
}
