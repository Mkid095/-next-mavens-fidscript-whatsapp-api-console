/**
 * instance/delete.ts — delete an instance (DB row + Evolution API).
 * Auth: JWT. Calls DELETE /api/instance/delete/:name.
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';

/** Destructive commands auto-confirm when --json/--yaml is set (agent has stated intent). */
function isAutoConfirmed(opts: { confirm: boolean }): boolean {
  return Boolean(opts.confirm) || flags.mode === 'json' || flags.mode === 'yaml';
}

export async function deleteInstance(name: string, opts: { confirm: boolean }): Promise<void> {
  if (!isAutoConfirmed(opts)) {
    outputCliError('MISSING_CONFIRM', `Deletion requires --confirm flag. fidscript instance delete ${name} --confirm`);
    process.exit(1);
  }

  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  try {
    const res = await client.jwtDelete<{ success: boolean; message?: string }>(
      `/api/instance/delete/${encodeURIComponent(name)}`,
    );

    if (flags.mode === 'json') {
      outputJson({ success: true, data: { deleted: name, ...res } });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: { deleted: name, ...res } });
      return;
    }

    console.error(`✓ Instance '${name}' deleted.`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}