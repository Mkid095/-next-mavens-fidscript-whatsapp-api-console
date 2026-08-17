/**
 * instance/logout.ts - Disconnect an instance from WhatsApp
 * DELETE /api/v1/instance/logout/:instance
 */
import { ApiClient } from '../../lib/api-client.js';
import { flags } from '../../lib/api-client.js';
import { outputJson, outputFidscriptError, outputCliError } from '../../lib/api-client.js';

export async function logoutInstance(name: string): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'No API key found. Pass --api-key or set FIDSCRIPT_API_KEY');
    process.exit(1);
  }

  if (flags.mode === 'json') {
    const res = await client.delete<{ logout?: string }>(
      `/api/v1/instance/logout/${encodeURIComponent(name)}`
    );
    outputJson(res);
    return;
  }

  console.error(`Logging out '${name}'...`);
  try {
    const res = await client.delete<{ logout?: string }>(
      `/api/v1/instance/logout/${encodeURIComponent(name)}`
    );
    console.error(`Logged out. ${res?.data?.logout ?? ''}`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
