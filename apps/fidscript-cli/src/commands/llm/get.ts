/**
 * llm/get.ts — get one LLM connection (with masked key).
 * Auth: JWT. GET /api/platform/llm-connections/:id would be ideal but the backend only exposes a list endpoint;
 *        we degrade to a filtered list. Documented for symmetry with other `get` commands.
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
} from '../../lib/api-client.js';

interface ConnectionRow {
  id: string;
  provider: string;
  model: string;
  endpoint: string;
  is_default: number | boolean;
  enabled: number | boolean;
  api_key_last4: string;
  monthly_limit: number;
  provider_name: string | null;
}

export async function getConnection(id: string): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputFidscriptError(new Error('Not signed in. Run `fidscript login` first.'));
    process.exit(1);
  }

  try {
    const data = await client.jwtGetData<unknown>('/api/platform/llm-connections');
    const list: ConnectionRow[] = Array.isArray(data) ? (data as ConnectionRow[]) : [];
    const found = list.find((r) => r.id === id);

    if (!found) {
      console.error(`No LLM connection with id '${id}'.`);
      console.error('Available:');
      for (const r of list) console.error(`  ${r.id}  ${r.provider}/${r.model}`);
      process.exit(1);
    }

    // Mask API key
    const safe = {
      ...found,
      api_key: found.api_key_last4 ? `sk-****${found.api_key_last4}` : '(none)',
      api_key_last4: undefined,
    };

    if (flags.mode === 'json') {
      outputJson({ success: true, data: safe });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: safe });
      return;
    }

    console.error(`Connection ${found.id}:`);
    console.error(`  Provider: ${found.provider} (${found.provider_name ?? 'custom'})`);
    console.error(`  Model:    ${found.model}`);
    console.error(`  Endpoint: ${found.endpoint || '(default)'}`);
    console.error(`  Default:  ${found.is_default === 1 || found.is_default === true ? 'yes' : 'no'}`);
    console.error(`  Enabled:  ${found.enabled === 1 || found.enabled === true ? 'yes' : 'no'}`);
    console.error(`  Key:      ${safe.api_key}`);
    if (found.monthly_limit) {
      console.error(`  Monthly limit: ${found.monthly_limit} tokens`);
    }
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}