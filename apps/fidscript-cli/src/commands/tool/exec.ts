/**
 * tool/exec.ts — execute a tool against its data source.
 * Auth: JWT. POST /api/platform/data-sources/:id/tools/:toolId/exec
 * Body: { "arguments": {...} }
 *
 * Examples:
 *   fidscript tool exec ds_123 tool_456 --args '{"q":"hello"}'
 *   fidscript tool exec ds_123 tool_456 --args @args.json
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';

/** Resolve a --args value: '@file.json' reads from disk, otherwise parse inline JSON. */
async function resolveArgs(raw: string | undefined): Promise<Record<string, unknown>> {
  let text: string;
  if (!raw) return {};
  if (raw.startsWith('@')) {
    const fs = await import('node:fs');
    text = fs.readFileSync(raw.slice(1), 'utf-8');
  } else {
    text = raw;
  }
  const parsed = JSON.parse(text);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('--args must be a JSON object (not array or primitive)');
  }
  return parsed as Record<string, unknown>;
}

export async function execTool(
  dataSourceId: string,
  toolId: string,
  opts: { args?: string },
): Promise<void> {
  let args: Record<string, unknown>;
  try {
    args = await resolveArgs(opts.args);
  } catch (err) {
    outputCliError(
      'INVALID_ARGS',
      `Could not parse --args: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  const path = `/api/platform/data-sources/${encodeURIComponent(dataSourceId)}/tools/${encodeURIComponent(toolId)}/exec`;

  try {
    const result = await client.jwtPostData<unknown>(path, { arguments: args });

    if (flags.mode === 'json') {
      outputJson({ success: true, data: result });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: result });
      return;
    }
    console.error(`✓ Tool ${toolId} executed.`);
    console.error(JSON.stringify(result, null, 2));
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
