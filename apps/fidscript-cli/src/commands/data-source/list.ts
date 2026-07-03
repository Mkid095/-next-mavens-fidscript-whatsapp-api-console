/**
 * data-source/list.ts — list data sources for the workspace.
 * Auth: JWT. GET /api/platform/data-sources
 *
 * Shows: name, type, is_builtin, tool count.
 */
import pc from 'picocolors';
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';
import { renderTable } from '../../lib/render.js';

interface DataSourceRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  config_json: string;
  is_builtin: number | boolean;
  enabled: number | boolean;
  created_at: string;
  updated_at: string;
}

interface DataSourceWithTools extends DataSourceRow {
  tool_count?: number;
}

function builtinLabel(v: unknown): string {
  if (v === 1 || v === true) return pc.cyan('builtin');
  return pc.dim('custom');
}

export async function listDataSources(): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  try {
    const data = await client.jwtGetData<DataSourceRow[] | unknown>('/api/platform/data-sources');
    const sources: DataSourceRow[] = Array.isArray(data) ? (data as DataSourceRow[]) : [];

    // Fetch tool counts per data source (parallel, best-effort)
    const withCounts: DataSourceWithTools[] = await Promise.all(
      sources.map(async (s) => {
        try {
          const tools = await client.jwtGetData<unknown[]>(
            `/api/platform/data-sources/${encodeURIComponent(s.id)}/tools`,
          );
          const count = Array.isArray(tools) ? tools.length : 0;
          return { ...s, tool_count: count };
        } catch {
          return { ...s, tool_count: 0 };
        }
      }),
    );

    if (flags.mode === 'json') {
      outputJson({ success: true, data: withCounts });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: withCounts });
      return;
    }

    if (withCounts.length === 0) {
      console.error('No data sources yet. Create one with:');
      console.error('  fidscript data-source create <name> --type <type>');
      return;
    }

    const displayRows = withCounts.map((r) => ({
      ...r,
      builtin_label: builtinLabel(r.is_builtin),
    }));

    renderTable(displayRows as unknown as Record<string, unknown>[], [
      { header: 'ID', key: 'id', width: 26 },
      { header: 'Name', key: 'name' },
      { header: 'Type', key: 'type' },
      { header: 'Scope', key: 'builtin_label' },
      { header: 'Tools', key: 'tool_count' },
    ]);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
