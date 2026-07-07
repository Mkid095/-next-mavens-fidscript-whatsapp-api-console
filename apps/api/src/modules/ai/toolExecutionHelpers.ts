/**
 * Tool execution helpers — shared utilities for tool execution.
 * Loads data sources, resolves connections, builds auth headers, substitutes path templates.
 * Also handles connector-based (Shopify, WooCommerce) credential resolution.
 */
import crypto from 'crypto';
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

// ─── Connector credential resolution ─────────────────────────────────────────────

export interface ResolvedConnector {
  accessToken: string;
  extra: Record<string, unknown>;
}

/** Decrypt and return the active (non-revoked) access token for a connector in a workspace. */
export function resolveConnectorCredentials(
  connectorId: string,
  workspaceId: string,
): ResolvedConnector | null {
  const row = db.prepare(`
    SELECT encrypted_token, iv, auth_tag, extra_json
    FROM connector_credentials
    WHERE connector_id = ? AND workspace_id = ? AND revoked_at IS NULL
  `).get(connectorId, workspaceId) as
    { encrypted_token: string; iv: string; auth_tag: string; extra_json: string | null } | undefined;

  if (!row) return null;

  try {
    const key = process.env.CONNECTOR_SECRET
      || process.env.ENCRYPTION_KEY
      || 'dev-secret-32-chars-long-herexxxx';
    const iv = Buffer.from(row.iv, 'hex');
    const authTag = Buffer.from(row.auth_tag, 'hex');
    // encrypted_token is iv + ciphertext base64
    const encryptedBuf = Buffer.from(row.encrypted_token, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key.slice(0, 32)), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encryptedBuf), decipher.final()]);
    const extra: Record<string, unknown> = row.extra_json ? JSON.parse(row.extra_json) : {};
    return { accessToken: decrypted.toString('utf8'), extra };
  } catch {
    return null;
  }
}

/**
 * Call a connector's REST API (Shopify / WooCommerce) with the resolved access token.
 * connectorSlug is used to look up credentials; action defines the endpoint + method.
 */
export async function callConnectorApi(
  connectorSlug: string,
  action: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  // Look up the connector definition
  const { ConnectorRegistry } = await import('./connectors/registry.js');
  const cfg = ConnectorRegistry.get(connectorSlug);
  if (!cfg) throw new Error(`Connector "${connectorSlug}" not registered`);

  const creds = resolveConnectorCredentials(cfg.id, args._workspaceId as string);
  if (!creds) throw new Error(`No active credentials for connector "${connectorSlug}" in this workspace`);

  // Find the action definition
  const actionDef = cfg.actions.find(a => a.name === action);
  if (!actionDef) throw new Error(`Connector "${connectorSlug}" has no action "${action}"`);

  // Parse the action's endpoint + method from executor_json in the tool row
  // (the tool row carries the executor config for this action)
  let endpoint = '';
  let method = 'GET';
  try {
    const params = JSON.parse(actionDef.parametersSchema);
    endpoint = params.endpoint as string || '';
    method = (params.method as string || 'GET').toUpperCase();
  } catch { /* use defaults */ }

  // Substitute path params from args
  const url = substitutePath(endpoint, args);

  // Build auth headers based on connector auth type
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.authType === 'oauth2') {
    headers['X-Shopify-Access-Token'] = creds.accessToken;
  } else if (cfg.authType === 'api_key') {
    headers['Authorization'] = `Bearer ${creds.accessToken}`;
  }

  const init: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'DELETE') {
    init.body = JSON.stringify(args);
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Connector API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
