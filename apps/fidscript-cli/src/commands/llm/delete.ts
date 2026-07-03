/**
 * llm/delete.ts — delete an LLM connection.
 * Auth: JWT. DELETE /api/platform/llm-connections/:id
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
} from '../../lib/api-client.js';

/** Destructive commands auto-confirm when --json/--yaml is set. */
function isAutoConfirmed(opts: { confirm: boolean }): boolean {
  return Boolean(opts.confirm) || flags.mode === 'json' || flags.mode === 'yaml';
}

export async function deleteConnection(id: string, opts: { confirm: boolean }): Promise<void> {
  if (!isAutoConfirmed(opts)) {
    outputFidscriptError(
      new Error('Deletion requires --confirm flag. fidscript llm delete <id> --confirm'),
    );
    process.exit(1);
  }

  const client = new ApiClient();
  if (!client.hasJwt) {
    outputFidscriptError(new Error('Not signed in. Run `fidscript login` first.'));
    process.exit(1);
  }

  try {
    const res = await client.jwtDelete<{ success: boolean; message?: string }>(
      `/api/platform/llm-connections/${encodeURIComponent(id)}`,
    );

    if (flags.mode === 'json') {
      outputJson({ success: true, data: { deleted: id, ...res } });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: { deleted: id, ...res } });
      return;
    }
    console.error(`✓ LLM connection ${id} deleted.`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}