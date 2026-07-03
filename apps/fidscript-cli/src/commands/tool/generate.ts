/**
 * tool/generate.ts — `fidscript tools generate`
 *
 * Auto-generate tools from an OpenAPI spec or a database schema.
 * Eliminates manual tool creation — the #1 friction point.
 *
 * Usage:
 *   fidscript tools generate --data-source <id> --from-openapi @spec.json
 *   fidscript tools generate --data-source <id> --from-schema @schema.json
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';

export async function generateTools(opts: {
  dataSource?: string;
  fromOpenapi?: string;
  fromSchema?: string;
}): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }
  if (!opts.dataSource) {
    outputCliError('MISSING_ARG', '--data-source <id> is required.');
    process.exit(1);
  }
  if (!opts.fromOpenapi && !opts.fromSchema) {
    outputCliError('MISSING_ARG', 'Provide either --from-openapi <file> or --from-schema <file>.');
    process.exit(1);
  }

  // Read the input file
  const fs = await import('node:fs');
  let input: string;
  const fileRef = opts.fromOpenapi ?? opts.fromSchema!;
  const raw = fileRef.startsWith('@') ? fs.readFileSync(fileRef.slice(1), 'utf-8') : fileRef;
  try { JSON.parse(raw); input = raw; } catch {
    outputCliError('INVALID_JSON', `Could not parse ${fileRef} as JSON.`);
    process.exit(1);
  }

  // Pick the right endpoint
  const endpoint = opts.fromOpenapi
    ? `/api/platform/data-sources/${encodeURIComponent(opts.dataSource)}/generate-from-openapi`
    : `/api/platform/data-sources/${encodeURIComponent(opts.dataSource)}/generate-from-schema`;
  const body = opts.fromOpenapi ? { spec: input } : { schema: input };

  try {
    const res = await client.jwtPostData<{ tools_generated: number; tool_ids: string[]; server_url?: string }>(endpoint, body);
    if (flags.mode === 'json') { outputJson({ success: true, data: res }); return; }
    if (flags.mode === 'yaml') { outputYaml({ success: true, data: res }); return; }
    console.error(`✓ Generated ${res.tools_generated} tool(s) on data source ${opts.dataSource}.`);
    console.error(`  Tool IDs: ${res.tool_ids.join(', ')}`);
    console.error('');
    console.error('Next: attach them to a chatbot:');
    console.error(`  fidscript chatbot tools <chatbot-id> attach <tool-id>`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}