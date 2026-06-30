/**
 * Chatbot Tool Executor — HTTP requests and safe dataset queries.
 * Tools are defined in chatbot_tools and executed on behalf of the LLM.
 */
import db, { saveDatabase } from '../database.js';
import { withCircuitBreak, CircuitOpenError } from './circuitBreaker.js';

interface ToolCall {
  toolId: string;
  toolName: string;
  toolType: string;
  config: Record<string, unknown>;
  input: Record<string, unknown>;
  chatbotId: string;
  conversationId: string;
}

interface ToolResult {
  success: boolean;
  output: unknown;
  error?: string;
  durationMs: number;
}

/**
 * Execute a single tool call and log the result.
 * Wrapped in a circuit breaker — if the tool's circuit is open, reject immediately.
 */
export async function executeToolCall(call: ToolCall): Promise<ToolResult> {
  const start = Date.now();

  // Reject immediately if circuit is open
  if (isCircuitOpen(call.toolId)) {
    const result: ToolResult = {
      success: false,
      output: null,
      error: `Circuit open: tool ${call.toolName} is temporarily disabled due to repeated failures`,
      durationMs: 0,
    };
    logChatbotToolCall(call, result, 0);
    return result;
  }

  let result: ToolResult;

  try {
    result = await withCircuitBreak(call.toolId, call.chatbotId, async () => {
      switch (call.toolType) {
        case 'http_request': {
          return await executeHttpTool(call);
        }
        case 'database_query': {
          return executeDatasetTool(call);
        }
        case 'webhook': {
          return await executeWebhookTool(call);
        }
        default: {
          return { success: false, output: null, error: `Unknown tool type: ${call.toolType}`, durationMs: 0 };
        }
      }
    });
  } catch (err) {
    result = { success: false, output: null, error: String(err), durationMs: Date.now() - start };
  }

  // Log to DB
  logChatbotToolCall(call, result, Date.now() - start);
  return result;
}

// Re-export so callers can check without executing
export { isCircuitOpen } from './circuitBreaker.js';

async function executeHttpTool(call: ToolCall): Promise<ToolResult> {
  const { config, input } = call;
  const method = String(config.method ?? 'GET').toUpperCase();
  const url = String(config.url ?? '');
  const headers: Record<string, string> = {};

  // Merge configured headers
  if (config.headers && typeof config.headers === 'object') {
    for (const [k, v] of Object.entries(config.headers as Record<string, string>)) {
      headers[k] = v;
    }
  }

  let body: string | undefined;
  if (method !== 'GET') {
    const contentType = headers['Content-Type'] ?? headers['content-type'] ?? 'application/json';
    body = contentType.includes('json') ? JSON.stringify(input) : new URLSearchParams(input as Record<string, string>).toString();
  }

  const start = Date.now();
  const res = await fetch(url, { method, headers, body });
  const durationMs = Date.now() - start;

  let output: unknown;
  try { output = await res.json(); } catch { output = await res.text(); }

  return {
    success: res.ok,
    output,
    error: res.ok ? undefined : `HTTP ${res.status}`,
    durationMs,
  };
}

async function executeWebhookTool(call: ToolCall): Promise<ToolResult> {
  const { config, input } = call;
  const url = String(config.url ?? '');
  const secret = String(config.secret ?? '');

  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'X-Webhook-Secret': secret } : {}),
    },
    body: JSON.stringify(input),
  });
  const durationMs = Date.now() - start;

  return {
    success: res.ok,
    output: { status: res.status },
    error: res.ok ? undefined : `Webhook returned ${res.status}`,
    durationMs,
  };
}

/**
 * Safe dataset query — NO raw SQL to LLM.
 * The customer defines table_name, exposed_fields, searchable_fields.
 * We build parameterized ILIKE queries internally.
 */
function executeDatasetTool(call: ToolCall): ToolResult {
  const { config, input } = call;
  const tableName = String(config.table_name ?? '');
  const exposedFields = String(config.exposed_fields ?? '');
  const searchableFields = String(config.searchable_fields ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const descriptionFields = String(config.description_fields ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const limit = Math.min(Number(config.max_results ?? 10), 50);

  if (!tableName || !exposedFields) {
    return { success: false, output: null, error: 'Dataset not properly configured', durationMs: 0 };
  }

  // Build query — only expose allowed fields
  const fields = exposedFields.split(',').map(s => s.trim()).filter(Boolean);
  const fieldList = fields.join(', ');

  // Build WHERE clause from search input
  const queryParam = String(input.query ?? '');
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (queryParam && searchableFields.length > 0) {
    const likeConditions = searchableFields.map(f => `${f} ILIKE ?`);
    conditions.push(`(${likeConditions.join(' OR ')})`);
    searchableFields.forEach(() => params.push(`%${queryParam}%`));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = `LIMIT ${limit}`;

  const sql = `SELECT ${fieldList} FROM ${tableName} ${whereClause} ${limitClause}`;

  try {
    const rows = db.prepare(sql).all(...params);
    return { success: true, output: rows, durationMs: 0 };
  } catch (err) {
    return { success: false, output: null, error: String(err), durationMs: 0 };
  }
}

/**
 * Log tool call to chatbot_tool_logs table.
 */
export function logChatbotToolCall(
  call: ToolCall,
  result: ToolResult,
  durationMs: number
): void {
  try {
    const id = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_tool_logs
      (id, chatbot_id, conversation_id, tool_id, tool_name, tool_input_json, tool_output_json, status, error_message, duration_ms, executed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      id,
      call.chatbotId,
      call.conversationId,
      call.toolId,
      call.toolName,
      JSON.stringify(call.input),
      JSON.stringify(result.output),
      result.success ? 'success' : 'error',
      result.error ?? '',
      durationMs
    );
    saveDatabase();
  } catch (_) { /* non-fatal */ }
}
