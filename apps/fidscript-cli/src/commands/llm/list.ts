/**
 * llm/list.ts — list LLM connections in the workspace.
 * Auth: JWT. GET /api/platform/llm-connections
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
} from '../../lib/api-client.js';
import { renderTable } from '../../lib/render.js';

interface ConnectionRow {
  id: string;
  provider: string;
  model: string;
  endpoint: string;
  is_default: number | boolean;
  enabled: number | boolean;
  provider_name: string | null;
  monthly_limit: number;
  api_key_last4: string;
  created_at: string;
}

function enabledLabel(v: unknown): string {
  if (v === 1 || v === true) return 'enabled';
  if (v === 0 || v === false) return 'disabled';
  return 'unknown';
}

export async function listConnections(): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputFidscriptError(new Error('Not signed in. Run `fidscript login` first.'));
    process.exit(1);
  }

  try {
    const data = await client.jwtGetData<unknown>('/api/platform/llm-connections');
    const rows: ConnectionRow[] = Array.isArray(data) ? (data as ConnectionRow[]) : [];

    if (flags.mode === 'json') {
      outputJson({ success: true, data: rows });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: rows });
      return;
    }

    if (rows.length === 0) {
      console.error('No LLM connections yet. Create one with:');
      console.error('  fidscript llm create <name> --provider openai --model gpt-4o-mini --api-key $OPENAI_KEY');
      return;
    }

    const displayRows = rows.map((r) => ({
      ...r,
      status: enabledLabel(r.enabled),
      is_default_str: r.is_default === 1 || r.is_default === true ? '★' : '',
      key_suffix: r.api_key_last4 ? `…${r.api_key_last4}` : '(none)',
    }));

    renderTable(displayRows as unknown as Record<string, unknown>[], [
      { header: 'ID', key: 'id', width: 28 },
      { header: 'Name', key: 'provider_name' },
      { header: 'Provider', key: 'provider' },
      { header: 'Model', key: 'model' },
      { header: 'Default', key: 'is_default_str' },
      { header: 'Status', key: 'status' },
      { header: 'Key', key: 'key_suffix' },
    ]);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}