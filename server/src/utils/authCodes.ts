import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

export type AuthCodePurpose = 'login' | 'register';

const CODE_TTL_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_CODES_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MINUTES = 15;

/** SQLite stores CURRENT_TIMESTAMP as 'YYYY-MM-DD HH:MM:SS' UTC. Match it. */
function utcString(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/** Generate a cryptographically random 6-digit code, zero-padded. */
function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

interface AuthCodeRow {
  id: string;
  code_hash: string;
  attempts: number;
  consumed_at: string | null;
  expires_at: string;
}

/**
 * Create a new magic code for the email. Enforces a per-email rate limit
 * (≤ MAX_CODES_PER_WINDOW codes per RATE_LIMIT_WINDOW_MINUTES).
 * Returns the plaintext code, or null if rate-limited.
 */
export function createAuthCode(email: string, purpose: AuthCodePurpose): string | null {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();
  const windowStart = utcString(new Date(now.getTime() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000));

  const recent = db
    .prepare(`SELECT COUNT(*) as count FROM auth_codes WHERE email = ? AND created_at > ?`)
    .get(normalizedEmail, windowStart) as { count: number } | undefined;

  if ((recent?.count ?? 0) >= MAX_CODES_PER_WINDOW) {
    return null;
  }

  const code = generateCode();
  const codeHash = bcrypt.hashSync(code, 10);
  const expiresAt = utcString(new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000));

  db.prepare(
    `INSERT INTO auth_codes (id, email, code_hash, purpose, attempts, expires_at) VALUES (?, ?, ?, ?, 0, ?)`
  ).run(uuidv4(), normalizedEmail, codeHash, purpose, expiresAt);

  return code;
}

/**
 * Verify and consume a magic code. Returns true on a valid, unconsumed,
 * non-expired code; false otherwise (and increments attempts on a miss).
 */
export function consumeAuthCode(email: string, code: string, purpose: AuthCodePurpose): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const nowUtc = utcString(new Date());

  const row = db
    .prepare(
      `SELECT id, code_hash, attempts, consumed_at, expires_at FROM auth_codes
       WHERE email = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ?
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(normalizedEmail, purpose, nowUtc) as AuthCodeRow | undefined;

  if (!row) return false;

  if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
    return false;
  }

  if (bcrypt.compareSync(code, row.code_hash)) {
    db.prepare(`UPDATE auth_codes SET consumed_at = ? WHERE id = ?`).run(nowUtc, row.id);
    return true;
  }

  db.prepare(`UPDATE auth_codes SET attempts = attempts + 1 WHERE id = ?`).run(row.id);
  return false;
}
