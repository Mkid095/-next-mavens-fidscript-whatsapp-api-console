/**
 * data-source/create.ts - create a workspace data source.
 * Auth: JWT. POST /api/platform/data-sources
 *
 * Examples:
 *   fidscript data-source create my-api --type api_endpoint --config @config.json
 *   fidscript data-source create customers --type sql_table --description "Customer records"
 *   fidscript data-source create demo-1 --type demo
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';

const VALID_TYPES = ['api_endpoint', 'sql_table', 'sql_query', 'static_json', 'demo'] as const;
type SourceType = (typeof VALID_TYPES)[number];

interface CreateResp {
  id: string;
  message?: string;
}

/** Resolve a --config value: '@file.json' reads from disk, otherwise parse inline JSON. */
async function resolveConfig(raw: string | undefined): Promise<string> {
  if (!raw) return '{}';
  if (raw.startsWith('@')) {
    const fs = await import('node:fs');
    return fs.readFileSync(raw.slice(1), 'utf-8');
  }
  // Validate inline JSON shape by parsing then re-stringifying
  JSON.parse(raw);
  return raw;
}

export async function createDataSource(
  name: string,
  opts: { type: string; description?: string; config?: string },
): Promise<void> {
  if (!VALID_TYPES.includes(opts.type as SourceType)) {
    outputCliError(
      'INVALID_TYPE',
      `type must be one of: ${VALID_TYPES.join(', ')} (got '${opts.type}')`,
    );
    process.exit(1);
  }

  let configJson: string;
  try {
    configJson = await resolveConfig(opts.config);
  } catch (err) {
    outputCliError(
      'INVALID_CONFIG',
      `Could not parse --config: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  const body: Record<string, unknown> = {
    name,
    type: opts.type,
    description: opts.description ?? '',
    config_json: configJson,
  };

  let resp: CreateResp;
  try {
    resp = await client.jwtPostData<CreateResp>('/api/platform/data-sources', body);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  if (flags.mode === 'json') {
    outputJson({ success: true, data: resp });
    return;
  }
  if (flags.mode === 'yaml') {
    outputYaml({ success: true, data: resp });
    return;
  }

  console.error(`✓ Data source '${name}' created.`);
  console.error(`  ID:   ${resp.id}`);
  console.error(`  Type: ${opts.type}`);
  if (opts.description) console.error(`  Desc: ${opts.description}`);
  console.error('');
  console.error('Next steps:');
  console.error(`  fidscript tool list --data-source ${resp.id}`);
  console.error(`  fidscript data-source list`);
}
