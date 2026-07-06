/**
 * Runtime Tracing — step-level observability for chatbot message processing.
 *
 * Each span records: step name, duration_ms, optional metadata,
 * the bot's outgoing message_id (when a response was generated),
 * and the customer's inbound message_id (always, so skipped paths are traceable).
 */
import db from '../database.js';

export type TraceStep =
  | 'trigger_eval'
  | 'knowledge_search'
  | 'llm_call'
  | 'tool_call'
  | 'response_send';

interface TraceMeta {
  triggered?: boolean;
  triggerId?: string;
  matchedKeyword?: string;
  ruleAction?: string;
  ruleName?: string;
  knowledgeSourceCount?: number;
  knowledgeSources?: string[];
  tokenCount?: number;
  toolId?: string;
  toolName?: string;
  toolSuccess?: boolean;
}

// Uses crypto.randomUUID() — 122 bits of entropy, guaranteed unique across distributed workers
export const newId = () => `trace_${crypto.randomUUID()}`;

// ─── Trace Insertion ──────────────────────────────────────────────────────────

export function insertTrace(
  conversationId: string,
  chatbotId: string,
  workspaceId: string,
  step: TraceStep,
  durationMs: number,
  meta?: TraceMeta,
  messageId?: string | null,           // bot's outgoing message_id (null for skipped paths)
  customerMessageId?: string | null,    // inbound customer message that triggered evaluation
): void {
  try {
    db.prepare(`INSERT INTO chatbot_traces
      (id, conversation_id, chatbot_id, workspace_id, step, duration_ms,
       metadata, created_at, message_id, customer_message_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`
    ).run(
      newId(),
      conversationId,
      chatbotId,
      workspaceId,
      step,
      durationMs,
      meta ? JSON.stringify(meta) : null,
      messageId ?? null,
      customerMessageId ?? null,
    );
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
  metaFn?: (result: T) => TraceMeta,
  messageId?: string | null,
  customerMessageId?: string | null,
): T {
  const start = Date.now();
  const result = fn();
  const durationMs = Date.now() - start;
  const meta = metaFn ? metaFn(result) : undefined;
  insertTrace(conversationId, chatbotId, workspaceId, step, durationMs, meta, messageId, customerMessageId);
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
  metaFn?: (result: T) => TraceMeta,
  messageId?: string | null,
  customerMessageId?: string | null,
): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const durationMs = Date.now() - start;
  const meta = metaFn ? metaFn(result) : undefined;
  insertTrace(conversationId, chatbotId, workspaceId, step, durationMs, meta, messageId, customerMessageId);
  return result;
}

// ─── Response Metadata ─────────────────────────────────────────────────────────

export function recordResponseMetadata(params: {
  messageId: string;
  chatbotId: string;
  sources?: Array<{ sourceId: string; sourceName: string; sourceType: string; relevanceScore?: number }>;
  tools?: Array<{ toolId: string; toolName: string; resultSummary?: string; input?: unknown; output?: unknown; durationMs?: number }>;
  confidence: number;
  model: string;
  promptVersion?: string;
  botVersion?: string;
  matchedTrigger?: string; // trigger name/keyword that fired
  matchedRule?: string;    // rule name that fired
  skipReason?: string;    // why no response was generated
}): void {
  try {
    db.prepare(`INSERT INTO chatbot_response_metadata
      (id, message_id, chatbot_id, sources, tools, confidence, model,
       prompt_version, bot_version, matched_trigger, matched_rule, skip_reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      newId(),
      params.messageId,
      params.chatbotId,
      params.sources ? JSON.stringify(params.sources) : null,
      params.tools ? JSON.stringify(params.tools) : null,
      params.confidence,
      params.model,
      params.promptVersion ?? null,
      params.botVersion ?? null,
      params.matchedTrigger ?? null,
      params.matchedRule ?? null,
      params.skipReason ?? null,
    );
  } catch (_) { /* non-fatal */ }
}
