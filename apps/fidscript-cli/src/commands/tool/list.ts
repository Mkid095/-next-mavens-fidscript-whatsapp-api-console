/**
 * tool/list.ts - list tools in the workspace.
 * Auth: JWT.
 *   - With --data-source <id>: GET /api/platform/data-sources/:id/tools
 *   - Without: lists tools across ALL data sources (fetches each DS's tools)
 *
 * Shows: name, type, description (truncated).
 */
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';
import { renderTable } from '../../lib/render.js';

interface ToolRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  parameters_json: string;
  executor_json: string;
  enabled: number | boolean;
  created_at: string;
}

interface ToolWithContext extends ToolRow {
  data_source_id?: string;
}

interface DataSourceRow {
  id: string;
  name: string;
}

const MAX_DESC = 60;

function truncate(s: string | null, max: number): string {
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export async function listTools(opts: { dataSource?: string }): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  try {
    let tools: ToolWithContext[];

    if (opts.dataSource) {
      const dsId = opts.dataSource;
      const data = await client.jwtGetData<ToolRow[] | unknown>(
        `/api/platform/data-sources/${encodeURIComponent(dsId)}/tools`,
      );
      const rows: ToolRow[] = Array.isArray(data) ? (data as ToolRow[]) : [];
      tools = rows.map((t) => ({ ...t, data_source_id: dsId }));
    } else {
      // List across all data sources
      const dsData = await client.jwtGetData<DataSourceRow[] | unknown>(
        '/api/platform/data-sources',
      );
      const sources: DataSourceRow[] = Array.isArray(dsData) ? (dsData as DataSourceRow[]) : [];
      const grouped = await Promise.all(
        sources.map(async (ds) => {
          try {
            const t = await client.jwtGetData<ToolRow[] | unknown>(
              `/api/platform/data-sources/${encodeURIComponent(ds.id)}/tools`,
            );
            return (Array.isArray(t) ? (t as ToolRow[]) : []).map((row) => ({
              ...row,
              data_source_id: ds.id,
            }));
          } catch {
            return [] as ToolWithContext[];
          }
        }),
      );
      tools = grouped.flat();
    }

    if (flags.mode === 'json') {
      outputJson({ success: true, data: tools });
      return;
    }
    if (flags.mode === 'yaml') {
      outputYaml({ success: true, data: tools });
      return;
    }

    if (tools.length === 0) {
      console.error('No tools found.');
      if (!opts.dataSource) {
        console.error('Create a data source first: fidscript data-source create <name> --type <type>');
      }
      return;
    }

    const displayRows = tools.map((t) => ({
      ...t,
      description_short: truncate(t.description, MAX_DESC),
    }));

    renderTable(displayRows as unknown as Record<string, unknown>[], [
      { header: 'ID', key: 'id', width: 26 },
      { header: 'Name', key: 'name' },
      { header: 'Type', key: 'type' },
      { header: 'Description', key: 'description_short' },
      ...(opts.dataSource ? [] : [{ header: 'Data Source', key: 'data_source_id' as const }]),
    ]);
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}
