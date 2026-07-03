/**
 * llm/providers.ts — list providers available in your workspace's registry.
 * Auth: JWT. GET /api/platform/llm-connections/available-providers
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
} from '../../lib/api-client.js';
import { renderTable } from '../../lib/render.js';

interface Provider {
  id: string;
  name: string;
  provider_type: string;
  is_free_tier: boolean;
  base_url: string;
}

export async function listProviders(): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputFidscriptError(new Error('Not signed in. Run `fidscript login` first.'));
    process.exit(1);
  }

  try {
    const data = await client.jwtGetData<unknown>('/api/platform/llm-connections/available-providers');
    const list: Provider[] = Array.isArray(data) ? (data as Provider[]) : [];

    if (flags.mode === 'json') {
      outputJson({ success: true, data: list });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: list });
      return;
    }

    if (list.length === 0) {
      console.error('No providers available. Ask an admin to register one.');
      return;
    }

    renderTable(list as unknown as Record<string, unknown>[], [
      { header: 'ID', key: 'id', width: 24 },
      { header: 'Name', key: 'name' },
      { header: 'Type', key: 'provider_type' },
      {
        header: 'Tier',
        key: 'is_free_tier',
        color: (v) => v ? 'free' : 'paid',
      },
    ]);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}