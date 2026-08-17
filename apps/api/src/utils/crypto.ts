/**
 * BYOLLM Crypto Utilities
 * AES-256-GCM encryption for stored API keys.
 * Master key from process.env.BYOLLM_MASTER_KEY (32 bytes hex = 64 chars).
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getMasterKey(): Buffer {
  const key = process.env.BYOLLM_MASTER_KEY;
  if (!key) throw new Error('BYOLLM_MASTER_KEY env var is not set');
  return Buffer.from(key, 'hex');
}

export interface EncryptedPayload {
  iv: string;       // hex
  authTag: string;  // hex
  ciphertext: string; // hex
  keyVersion: number;
}

/**
 * Encrypt an API key using AES-256-GCM.
 * Returns { iv, authTag, ciphertext, keyVersion }.
 */
export function encryptApiKey(apiKey: string, keyVersion = 1): EncryptedPayload {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

  let ciphertext = cipher.update(apiKey, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    ciphertext,
    keyVersion,
  };
}

/**
 * Decrypt an API key from an EncryptedPayload.
 */
export function decryptApiKey(payload: EncryptedPayload): string {
  const masterKey = getMasterKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    masterKey,
    Buffer.from(payload.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));

  let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Mask an API key for display: "sk-****abcd"
 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return 'sk-****';
  return `sk-****${key.slice(-4)}`;
}

/**
 * Rotate an encrypted key to a new version.
 * Currently just bumps keyVersion - actual re-encryption would need the old key.
 */
export function rotateKeyVersion(payload: EncryptedPayload): EncryptedPayload {
  return { ...payload, keyVersion: payload.keyVersion + 1 };
}
