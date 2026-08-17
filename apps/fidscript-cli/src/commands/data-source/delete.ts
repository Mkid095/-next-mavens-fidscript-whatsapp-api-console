/**
 * data-source/delete.ts - delete a data source (cascades to its tools).
 * Auth: JWT. DELETE /api/platform/data-sources/:id
 *
 * Example:
 *   fidscript data-source delete ds_1234 --confirm
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';

/** Destructive commands auto-confirm when --json/--yaml is set. */
function isAutoConfirmed(opts: { confirm: boolean }): boolean {
  return Boolean(opts.confirm) || flags.mode === 'json' || flags.mode === 'yaml';
}

export async function deleteDataSource(id: string, opts: { confirm: boolean }): Promise<void> {
  if (!isAutoConfirmed(opts)) {
    outputCliError(
      'CONFIRM_REQUIRED',
      `Deletion requires --confirm. fidscript data-source delete <id> --confirm`,
    );
    process.exit(1);
  }

  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  try {
    const res = await client.jwtDelete<{ success: boolean; message?: string }>(
      `/api/platform/data-sources/${encodeURIComponent(id)}`,
    );

    if (flags.mode === 'json') {
      outputJson({ success: true, data: { deleted: id, ...res } });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: { deleted: id, ...res } });
      return;
    }
    console.error(`✓ Data source ${id} deleted.`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
