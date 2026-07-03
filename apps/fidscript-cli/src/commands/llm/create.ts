/**
 * llm/create.ts — create a workspace LLM connection (BYO API key).
 * Auth: JWT. POST /api/platform/llm-connections
 *
 * Examples:
 *   fidscript llm create openai-prod --provider openai --model gpt-4o-mini --api-key $OPENAI_KEY
 *   fidscript llm create gemini-flash --provider gemini --model gemini-2.0-flash --api-key @key.txt --default
 *   fidscript llm create ollama --provider custom --model llama3.1 --endpoint http://localhost:11434 --default
 *   fidscript llm create azure --provider azure --model gpt-4o --endpoint https://my.openai.azure.com --api-key $AZURE_KEY --provider-registry-id <id>
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
} from '../../lib/api-client.js';

interface CreateResp { id: string; message?: string; }

interface AvailableProvider {
  id: string;
  name: string;
  provider_type: string;
  is_free_tier: boolean;
}

export async function createConnection(
  _name: string, // accepted but not sent (the server names via provider+model)
  opts: {
    provider: string;
    model: string;
    apiKey?: string;
    endpoint?: string;
    default?: boolean;
    monthlyLimit?: number;
    priority?: number;
    providerRegistryId?: string;
  },
): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputFidscriptError(new Error('Not signed in. Run `fidscript login` first.'));
    process.exit(1);
  }

  // Resolve API key — accept @file syntax
  let apiKey = opts.apiKey;
  if (apiKey && apiKey.startsWith('@')) {
    const fs = await import('node:fs');
    apiKey = fs.readFileSync(apiKey.slice(1), 'utf-8').trim();
  }

  const body: Record<string, unknown> = {
    provider: opts.provider,
    model: opts.model,
    ...(apiKey ? { api_key: apiKey } : {}),
    ...(opts.endpoint ? { endpoint: opts.endpoint } : {}),
    ...(opts.default ? { is_default: true } : {}),
    ...(opts.monthlyLimit ? { monthly_limit: opts.monthlyLimit } : {}),
    ...(opts.priority ? { priority: opts.priority } : {}),
    ...(opts.providerRegistryId ? { provider_registry_id: opts.providerRegistryId } : {}),
  };

  let resp: CreateResp;
  try {
    resp = await client.jwtPostData<CreateResp>('/api/platform/llm-connections', body);
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

  console.error(`✓ LLM connection created.`);
  console.error(`  ID:       ${resp.id}`);
  console.error(`  Provider: ${opts.provider}`);
  console.error(`  Model:    ${opts.model}`);
  if (opts.endpoint) console.error(`  Endpoint: ${opts.endpoint}`);
  console.error('');
  console.error('Next steps:');
  console.error(`  fidscript llm test ${resp.id}`);
  console.error(`  fidscript chatbot ai-config <chatbot-id> --llm-connection ${resp.id}`);
}

/** Helper used by agent flows — list available providers (registry). */
export async function listAvailableProviders(): Promise<AvailableProvider[]> {
  const client = new ApiClient();
  return await client.jwtGetData<AvailableProvider[]>('/api/platform/llm-connections/available-providers');
}