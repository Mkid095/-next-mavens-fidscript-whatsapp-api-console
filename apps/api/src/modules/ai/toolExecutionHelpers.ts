/**
 * Tool execution helpers — shared utilities for tool execution.
 * Loads data sources, resolves connections, builds auth headers, substitutes path templates.
 */
import db from '../../database.js';

interface DataSourceRow {
  id: string;
  type: string;
  config_json: string;
  connection_id: string | null;
  workspace_id: string;
}

interface ConnectionRow {
  id: string;
  base_url: string;
  encrypted_config: string;
  auth_type: string;
  auth_header_name: string;
  type: string;
}

export interface ExecutorConfig {
  records?: Array<Record<string, unknown>>;
  keyField?: string;
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  pathTemplate?: string;
  bodyTemplate?: Record<string, unknown>;
  demoData?: unknown;
  steps?: Array<{ tool_id: string; pass_args?: boolean }>;
}

export function loadDataSource(dataSourceId: string, workspaceId: string): { ds: DataSourceRow; conn: ConnectionRow | null } {
  const ds = db.prepare(`
    SELECT id, type, config_json, connection_id, workspace_id
    FROM data_sources WHERE id = ? AND workspace_id = ?
  `).get(dataSourceId, workspaceId) as DataSourceRow | undefined;

  if (!ds) throw new Error(`Data source '${dataSourceId}' not found`);

  let conn: ConnectionRow | null = null;
  if (ds.connection_id) {
    conn = db.prepare(`
      SELECT id, base_url, encrypted_config, auth_type, auth_header_name, type
      FROM integration_connections WHERE id = ? AND workspace_id = ?
    `).get(ds.connection_id, workspaceId) as ConnectionRow | undefined ?? null;
  }

  return { ds, conn };
}

export function buildAuthHeaders(conn: ConnectionRow | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!conn) return headers;

  try {
    const cfg = JSON.parse(conn.encrypted_config) as Record<string, unknown>;
    const apiKey = String(cfg.api_key ?? cfg.token ?? '');

    if (apiKey) {
      const headerName = conn.auth_header_name || 'Authorization';
      if (conn.auth_type === 'bearer') {
        headers[headerName] = `Bearer ${apiKey}`;
      } else {
        headers[headerName] = apiKey;
      }
    }
  } catch { /* ignore malformed config */ }

  return headers;
}

export function resolveExecutor(ds: DataSourceRow, conn: ConnectionRow | null, toolExecutor: Record<string, unknown>): ExecutorConfig {
  let dsConfig: Record<string, unknown> = {};
  try { dsConfig = JSON.parse(ds.config_json); } catch { /* keep default */ }

  const baseUrl = conn?.base_url ?? '';
  const merged: ExecutorConfig = {
    ...(dsConfig as ExecutorConfig),
    ...(toolExecutor as ExecutorConfig),
  };

  if (ds.type === 'demo' || ds.type === 'static_json') {
    return merged;
  }

  if (merged.endpoint && baseUrl && !merged.endpoint.startsWith('http')) {
    merged.endpoint = `${baseUrl.replace(/\/$/, '')}${merged.endpoint}`;
  }

  return merged;
}

export function substitutePath(template: string, args: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = args[key];
    return v === undefined || v === null ? '' : encodeURIComponent(String(v));
  });
}
