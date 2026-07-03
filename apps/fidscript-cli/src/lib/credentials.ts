/**
 * credentials.ts — read/write ~/.fidscript/credentials INI file
 *
 * File format (INI):
 *   [default]
 *   api_key = fidscript_live_xxx
 *   jwt = eyJhbGc... (Bearer token for /api/instance / /api/platform routes)
 *   email = user@example.com (last login email, used by fidscript refresh)
 *   base_url = https://whatsapp.fidscript.com
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import ini from 'ini';

const CREDENTIALS_DIR = path.join(homedir(), '.fidscript');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials');

export interface Credentials {
  apiKey: string;
  jwt?: string;
  email?: string;
  baseUrl: string;
}

function ensureDir(): void {
  mkdirSync(CREDENTIALS_DIR, { recursive: true });
}

export function loadCredentials(): Credentials | null {
  try {
    const content = readFileSync(CREDENTIALS_FILE, 'utf-8');
    const parsed = ini.parse(content) as { default?: Record<string, string> };
    const section = parsed?.default;
    if (!section?.api_key) return null;
    return {
      apiKey: section.api_key,
      jwt: section.jwt || undefined,
      email: section.email || undefined,
      baseUrl: section.base_url || DEFAULT_BASE_URL,
    };
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Credentials): void {
  ensureDir();
  const content = ini.stringify({
    default: {
      api_key: creds.apiKey,
      ...(creds.jwt ? { jwt: creds.jwt } : {}),
      ...(creds.email ? { email: creds.email } : {}),
      base_url: creds.baseUrl,
    },
  });
  writeFileSync(CREDENTIALS_FILE, content, 'utf-8');
}

export function clearCredentials(): void {
  try {
    writeFileSync(CREDENTIALS_FILE, '[default]\n', 'utf-8');
  } catch {
    // ignore
  }
}

export const DEFAULT_BASE_URL = 'https://whatsapp.fidscript.com';