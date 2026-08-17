/**
 * instance/restart.ts - Restart an instance (requires --confirm)
 * POST /api/v1/instance/restart/:instance
 */
import { ApiClient } from '../../lib/api-client.js';
import { flags } from '../../lib/api-client.js';
import { outputJson, outputFidscriptError, outputCliError } from '../../lib/api-client.js';

/** Destructive commands auto-confirm when --json/--yaml is set (agent has stated intent). */
function isAutoConfirmed(opts: { confirm: boolean }): boolean {
  return Boolean(opts.confirm) || flags.mode === 'json' || flags.mode === 'yaml';
}

export async function restartInstance(name: string, opts: { confirm: boolean }): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'No API key found. Pass --api-key or set FIDSCRIPT_API_KEY');
    process.exit(1);
  }
  if (!isAutoConfirmed(opts)) {
    outputCliError('MISSING_CONFIRM', `Restart requires --confirm flag. fidscript instance restart ${name} --confirm`);
    process.exit(1);
  }

  if (flags.mode === 'json') {
    const res = await client.post<{ restart?: string }>(
      `/api/v1/instance/restart/${encodeURIComponent(name)}`,
      { confirm: true }
    );
    outputJson(res);
    return;
  }

  try {
    const res = await client.post<{ restart?: string }>(
      `/api/v1/instance/restart/${encodeURIComponent(name)}`,
      { confirm: true }
    );
    console.error(`Restarted. ${res?.data?.restart ?? ''}`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
