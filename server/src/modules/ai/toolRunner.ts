/**
 * toolRunner.ts — execute a tool against an external system.
 *
 * The chatbot NEVER touches our database for customer data. Tools are the
 * ONLY interface — they call external APIs, databases, or static demo data.
 *
 * Tool types:
 *   lookup   — single-record fetch by key from a data source
 *   search   — free-text/filtered query returning multiple records
 *   query    — arbitrary SQL or API GET request
 *   action   — POST/PUT/DELETE to a remote API (mutating)
 *   workflow — multi-step chain that calls other tools in sequence
 */

import db from '../../database.js';

export interface ToolRunnerInput {
  tool: {
    id: string;
    name: string;
    type: string;
    parameters_json: string;
    executor_json: string;
    data_source_id: string;
  };
  arguments: Record<string, unknown>;
  workspaceId: string;
  chatbotId?: string;
  conversationId?: string;
}

export type ToolRunResult = unknown;

interface ExecutorConfig {
  /** For 'lookup' / 'search' with static_json data source */
  records?: Array<Record<string, unknown>>;
  keyField?: string;
  /** For 'query' / 'action' — HTTP config */
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  pathTemplate?: string;
  bodyTemplate?: Record<string, unknown>;
  /** For 'demo' type — returns mock data without calling any API */
  demoData?: unknown;
  /** For 'workflow' — list of steps */
  steps?: Array<{ tool_id: string; pass_args?: boolean }>;
}

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

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function substitutePath(template: string, args: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = args[key];
    return v === undefined || v === null ? '' : encodeURIComponent(String(v));
  });
}

/** Load a data source + its connection (if any). */
function loadDataSource(dataSourceId: string, workspaceId: string): { ds: DataSourceRow; conn: ConnectionRow | null } {
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

/** Build HTTP headers from connection auth. */
function buildAuthHeaders(conn: ConnectionRow | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!conn) return headers;

  try {
    const cfg = JSON.parse(conn.encrypted_config) as Record<string, unknown>;
    const apiKey = String(cfg.api_key ?? cfg.token ?? '');

    if (apiKey) {
      const headerName = conn.auth_header_name || 'Authorization';
      if (conn.auth_type === 'bearer') {
        headers[headerName] = `Bearer ${apiKey}`;
      } else if (conn.auth_type === 'api_key') {
        headers[headerName] = apiKey;
      } else {
        headers[headerName] = apiKey;
      }
    }
  } catch { /* ignore malformed config */ }

  return headers;
}

/** Merge data source config + connection into a single executor config. */
function resolveExecutor(ds: DataSourceRow, conn: ConnectionRow | null, toolExecutor: Record<string, unknown>): ExecutorConfig {
  let dsConfig: Record<string, unknown> = {};
  try { dsConfig = JSON.parse(ds.config_json); } catch { /* keep default */ }

  const baseUrl = conn?.base_url ?? '';
  const merged: ExecutorConfig = {
    ...(dsConfig as ExecutorConfig),
    ...(toolExecutor as ExecutorConfig),
  };

  // If the data source has a demo/static config, use it directly
  if (ds.type === 'demo' || ds.type === 'static_json') {
    return merged;
  }

  // For api_endpoint / sql types, prepend the connection's base_url
  if (merged.endpoint && baseUrl && !merged.endpoint.startsWith('http')) {
    merged.endpoint = `${baseUrl.replace(/\/$/, '')}${merged.endpoint}`;
  }

  return merged;
}

/** Main entry — dispatch by tool type. */
export async function executeTool(input: ToolRunnerInput): Promise<ToolRunResult> {
  const { ds, conn } = loadDataSource(input.tool.data_source_id, input.workspaceId);

  let executor: ExecutorConfig = {};
  try { executor = JSON.parse(input.tool.executor_json); } catch { /* keep default */ }

  const cfg = resolveExecutor(ds, conn, executor as unknown as Record<string, unknown>);
  const authHeaders = buildAuthHeaders(conn);

  // Demo / static — returns data from the data source config without calling any API.
  // Used for the e-commerce demo so users can try the platform without connecting a real system.
  if (ds.type === 'demo' || ds.type === 'static_json') {
    return executeStaticTool(input, cfg);
  }

  switch (input.tool.type) {
    case 'lookup':
      return executeLookup(input, cfg);

    case 'search':
      return executeSearch(input, cfg);

    case 'query':
      return executeHttp(input, cfg, authHeaders, 'GET');

    case 'action':
      return executeHttp(input, cfg, authHeaders, cfg.method ?? 'POST');

    case 'workflow':
      return executeWorkflow(input, cfg);

    default:
      throw new Error(`Unknown tool type: ${input.tool.type}`);
  }
}

// ── Tool type implementations ──────────────────────────────────────────────

/** Static/demo data: records stored in config_json. No API call. */
function executeStaticTool(input: ToolRunnerInput, cfg: ExecutorConfig): ToolRunResult {
  if (!Array.isArray(cfg.records)) {
    // If the tool itself specifies a type, use that against the records
    return cfg.demoData ?? null;
  }
  // Fall through to lookup or search depending on arguments
  if (input.arguments.query !== undefined) return executeSearch(input, cfg);
  return executeLookup(input, cfg);
}

/** Single-record fetch by key field. */
function executeLookup(input: ToolRunnerInput, cfg: ExecutorConfig): ToolRunResult {
  if (!Array.isArray(cfg.records)) {
    throw new Error(`lookup tool "${input.tool.name}" has no records`);
  }
  const keyField = cfg.keyField ?? 'id';
  const target = String(input.arguments[keyField] ?? '');
  return cfg.records.find((r) => String(r[keyField]) === target) ?? null;
}

/** Free-text + filter search over in-memory records. */
function executeSearch(input: ToolRunnerInput, cfg: ExecutorConfig): ToolRunResult {
  if (!Array.isArray(cfg.records)) {
    throw new Error(`search tool "${input.tool.name}" has no records`);
  }
  const query = String(input.arguments.query ?? '').toLowerCase().trim();
  const inStockOnly = Boolean(input.arguments.in_stock_only);
  const category = input.arguments.category ? String(input.arguments.category).toLowerCase() : null;

  return cfg.records
    .filter((r) => {
      if (inStockOnly && Number(r.in_stock) === 0) return false;
      if (category && String(r.category ?? '').toLowerCase() !== category) return false;
      if (!query) return true;
      const haystack = Object.values(r).map((v) => String(v ?? '').toLowerCase()).join(' ');
      return haystack.includes(query);
    })
    .slice(0, 10);
}

/** HTTP request to an external API. */
async function executeHttp(
  input: ToolRunnerInput,
  cfg: ExecutorConfig,
  authHeaders: Record<string, string>,
  defaultMethod: string,
): Promise<ToolRunResult> {
  if (!cfg.endpoint) throw new Error(`tool "${input.tool.name}" has no endpoint`);

  const method = (cfg.method ?? defaultMethod).toUpperCase();
  const url = cfg.pathTemplate
    ? substitutePath(cfg.pathTemplate, input.arguments)
    : cfg.endpoint;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(cfg.headers ?? {}),
  };

  const init: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'DELETE') {
    const body = isPlainObject(cfg.bodyTemplate)
      ? { ...cfg.bodyTemplate, ...input.arguments }
      : input.arguments;
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { status: res.status, body: text };
  }
}

/** Multi-step workflow: calls multiple tools in sequence. */
async function executeWorkflow(input: ToolRunnerInput, cfg: ExecutorConfig): Promise<ToolRunResult> {
  if (!Array.isArray(cfg.steps)) {
    throw new Error(`workflow tool "${input.tool.name}" has no steps`);
  }

  const results: unknown[] = [];
  let accumulatedArgs = { ...input.arguments };

  for (const step of cfg.steps) {
    const toolRow = db.prepare(`
      SELECT id, name, type, parameters_json, executor_json, data_source_id
      FROM tools WHERE id = ? AND data_source_id IN (
        SELECT id FROM data_sources WHERE workspace_id = ?
      )
    `).get(step.tool_id, input.workspaceId) as ToolRunnerInput['tool'] | undefined;

    if (!toolRow) {
      results.push({ step: step.tool_id, error: 'tool not found' });
      continue;
    }

    const stepArgs = step.pass_args ? accumulatedArgs : {};
    const result = await executeTool({
      tool: toolRow,
      arguments: stepArgs,
      workspaceId: input.workspaceId,
      chatbotId: input.chatbotId,
      conversationId: input.conversationId,
    });

    results.push({ step: step.tool_id, result });

    // Merge result into accumulated args for the next step
    if (isPlainObject(result)) {
      accumulatedArgs = { ...accumulatedArgs, ...result };
    }
  }

  return { steps: results, finalArgs: accumulatedArgs };
}