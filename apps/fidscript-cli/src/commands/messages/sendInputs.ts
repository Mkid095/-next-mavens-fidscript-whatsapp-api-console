import { outputCliError } from '../../lib/api-client.js';

/** Shared response type across all send endpoints. */
export interface SendResponse {
  key?: { id?: string };
  message?: string;
  timestamp?: string;
}

/**
 * Parse a JSON value from the CLI.
 * - Undefined → undefined
 * - "@/path/to/file.json" → parsed from file contents
 * - "{ ... }" → parsed as JSON string
 * Exits on parse failure.
 */
export async function loadJson(value: string | undefined, label: string): Promise<unknown | undefined> {
  if (value === undefined) return undefined;
  if (value.startsWith('@')) {
    const fs = await import('node:fs');
    return JSON.parse(fs.readFileSync(value.slice(1), 'utf-8'));
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    outputCliError('INVALID_JSON', `--${label} must be valid JSON: ${(err as Error).message}`);
    process.exit(1);
  }
}
