/**
 * llm/update.ts — update an existing LLM connection.
 * Auth: JWT. PUT /api/platform/llm-connections/:id
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
} from '../../lib/api-client.js';

export async function updateConnection(
  id: string,
  opts: {
    model?: string;
    endpoint?: string;
    apiKey?: string;
    default?: boolean;
    enabled?: boolean;
    monthlyLimit?: number;
    priority?: number;
  },
): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputFidscriptError(new Error('Not signed in. Run `fidscript login` first.'));
    process.exit(1);
  }

  let apiKey = opts.apiKey;
  if (apiKey && apiKey.startsWith('@')) {
    const fs = await import('node:fs');
    apiKey = fs.readFileSync(apiKey.slice(1), 'utf-8').trim();
  }

  const body: Record<string, unknown> = {
    ...(opts.model ? { model: opts.model } : {}),
    ...(opts.endpoint ? { endpoint: opts.endpoint } : {}),
    ...(apiKey ? { api_key: apiKey } : {}),
    ...(opts.default !== undefined ? { is_default: opts.default } : {}),
    ...(opts.enabled !== undefined ? { enabled: opts.enabled } : {}),
    ...(opts.monthlyLimit !== undefined ? { monthly_limit: opts.monthlyLimit } : {}),
    ...(opts.priority !== undefined ? { priority: opts.priority } : {}),
  };

  try {
    const res = await client.jwtPut<{ success: boolean; message?: string }>(
      `/api/platform/llm-connections/${encodeURIComponent(id)}`,
      body,
    );

    if (flags.mode === 'json') {
      outputJson(res);
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml(res);
      return;
    }
    console.error(`✓ LLM connection '${id}' updated.`);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}