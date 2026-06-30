/**
 * Runtime Tracing — step-level observability for chatbot message processing.
 *
 * Each span records: step name, duration_ms, and optional metadata JSON.
 * Useful for debugging, performance tuning, and understanding bot behaviour.
 */
import db, { saveDatabase } from '../database.js';

export type TraceStep =
  | 'trigger_eval'
  | 'knowledge_search'
  | 'llm_call'
  | 'tool_call'
  | 'response_send';

interface TraceMeta {
  triggered?: boolean;
  triggerId?: string;
  knowledgeSourceCount?: number;
  knowledgeSources?: string[];
  tokenCount?: number;
  toolId?: string;
  toolName?: string;
  toolSuccess?: boolean;
}

const newId = () => `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function insertTrace(
  conversationId: string,
  chatbotId: string,
  workspaceId: string,
  step: TraceStep,
  durationMs: number,
  meta?: TraceMeta
): void {
  try {
    db.prepare(`INSERT INTO chatbot_traces
      (id, conversation_id, chatbot_id, workspace_id, step, duration_ms, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      newId(),
      conversationId,
      chatbotId,
      workspaceId,
      step,
      durationMs,
      meta ? JSON.stringify(meta) : null
    );
    // Don't saveDatabase() here — tracing is fire-and-forget to avoid adding latency
  } catch (_) { /* non-fatal */ }
}

/**
 * Insert a trace with automatic timing via a start timestamp.
 */
export function trace<T>(
  conversationId: string,
  chatbotId: string,
  workspaceId: string,
  step: TraceStep,
  fn: () => T,
  metaFn?: (result: T) => TraceMeta
): T {
  const start = Date.now();
  const result = fn();
  const durationMs = Date.now() - start;
  const meta = metaFn ? metaFn(result) : undefined;
  insertTrace(conversationId, chatbotId, workspaceId, step, durationMs, meta);
  return result;
}

/**
 * Async version of trace — awaits the promise and records duration.
 */
export async function traceAsync<T>(
  conversationId: string,
  chatbotId: string,
  workspaceId: string,
  step: TraceStep,
  fn: () => Promise<T>,
  metaFn?: (result: T) => TraceMeta
): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const durationMs = Date.now() - start;
  const meta = metaFn ? metaFn(result) : undefined;
  insertTrace(conversationId, chatbotId, workspaceId, step, durationMs, meta);
  return result;
}

// ─── Response Metadata ─────────────────────────────────────────────────────────

export function recordResponseMetadata(params: {
  messageId: string;
  chatbotId: string;
  sources?: Array<{ sourceId: string; sourceName: string; sourceType: string; relevanceScore?: number }>;
  tools?: Array<{ toolId: string; toolName: string; resultSummary?: string }>;
  confidence: number;
  model: string;
}): void {
  try {
    db.prepare(`INSERT INTO chatbot_response_metadata
      (id, message_id, chatbot_id, sources, tools, confidence, model, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      newId(),
      params.messageId,
      params.chatbotId,
      params.sources ? JSON.stringify(params.sources) : null,
      params.tools ? JSON.stringify(params.tools) : null,
      params.confidence,
      params.model
    );
  } catch (_) { /* non-fatal */ }
}
