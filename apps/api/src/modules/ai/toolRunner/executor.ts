/**
 * toolRunner executor implementations.
 */
import db from '../../../database.js';
import type { ToolRunnerInput, ToolRunResult, ExecutorConfig } from './types.js';
import { loadDataSource, buildAuthHeaders, resolveExecutor, isPlainObject, substitutePath } from './helpers.js';

/** Main entry — dispatch by tool type. */
export async function executeTool(input: ToolRunnerInput): Promise<ToolRunResult> {
  const { ds, conn } = loadDataSource(input.tool.data_source_id, input.workspaceId);

  let executor: ExecutorConfig = {};
  try { executor = JSON.parse(input.tool.executor_json); } catch { /* keep default */ }

  const cfg = resolveExecutor(ds, conn, executor as unknown as Record<string, unknown>);
  const authHeaders = buildAuthHeaders(conn);

  if (ds.type === 'demo' || ds.type === 'static_json') {
    return executeStaticTool(input, cfg);
  }

  switch (input.tool.type) {
    case 'lookup':      return executeLookup(input, cfg);
    case 'search':     return executeSearch(input, cfg);
    case 'query':       return executeHttp(input, cfg, authHeaders, 'GET');
    case 'action':      return executeHttp(input, cfg, authHeaders, cfg.method ?? 'POST');
    case 'workflow':   return executeWorkflow(input, cfg);
    default:            throw new Error(`Unknown tool type: ${input.tool.type}`);
  }
}

/** Static/demo data: records stored in config_json. No API call. */
export function executeStaticTool(input: ToolRunnerInput, cfg: ExecutorConfig): ToolRunResult {
  if (!Array.isArray(cfg.records)) {
    return cfg.demoData ?? null;
  }
  if (input.arguments.query !== undefined) return executeSearch(input, cfg);
  return executeLookup(input, cfg);
}

/** Single-record fetch by key field. */
export function executeLookup(input: ToolRunnerInput, cfg: ExecutorConfig): ToolRunResult {
  if (!Array.isArray(cfg.records)) {
    throw new Error(`lookup tool "${input.tool.name}" has no records`);
  }
  const keyField = cfg.keyField ?? 'id';
  const target = String(input.arguments[keyField] ?? '');
  return cfg.records.find((r) => String(r[keyField]) === target) ?? null;
}

/** Free-text + filter search over in-memory records. */
export function executeSearch(input: ToolRunnerInput, cfg: ExecutorConfig): ToolRunResult {
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
export async function executeHttp(
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
export async function executeWorkflow(input: ToolRunnerInput, cfg: ExecutorConfig): Promise<ToolRunResult> {
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

    if (isPlainObject(result)) {
      accumulatedArgs = { ...accumulatedArgs, ...result };
    }
  }

  return { steps: results, finalArgs: accumulatedArgs };
}
