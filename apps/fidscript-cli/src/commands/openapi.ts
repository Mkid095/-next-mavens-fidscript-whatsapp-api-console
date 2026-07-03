/**
 * openapi.ts — fetch the live OpenAPI spec from the public API.
 *
 *   GET /api/v1/openapi.json
 *   GET /api/v1/openapi.yaml
 *   GET /api/v1/postman-collection.json
 *
 * Use `--format yaml` to switch formats. Pipe to file:
 *   fidscript openapi > schema.json
 *   fidscript openapi --format yaml > schema.yaml
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../lib/api-client.js';

export async function openapi(opts: { format?: 'json' | 'yaml' }): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'No API key found. Pass --api-key or set FIDSCRIPT_API_KEY');
    process.exit(1);
  }

  const format = opts.format ?? (flags.mode === 'yaml' ? 'yaml' : 'json');
  const path = `/api/v1/openapi.${format}`;

  try {
    if (flags.mode === 'json' || format === 'json') {
      const data = await client.get<unknown>(path);
      // Print the spec to stdout (raw) so agents can pipe it
      if (flags.mode === 'json' && data.success) {
        outputJson(data);
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
      return;
    }
    // YAML path — fetch raw
    const res = await fetch(`${client.configuredBaseUrl.replace(/\/$/, '')}${path}`, {
      headers: { 'X-API-Key': client['apiKey'] ?? '' },
    });
    if (!res.ok) {
      outputCliError('OPENAPI_FAILED', `Failed to fetch OpenAPI: HTTP ${res.status}`);
      process.exit(1);
    }
    const text = await res.text();
    if (flags.mode === 'yaml') outputYaml({ spec: text });
    else console.log(text);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}