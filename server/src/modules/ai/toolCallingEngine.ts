/**
 * toolCallingEngine.ts — LLM ↔ tool execution loop.
 *
 * Wraps the existing LLMGateway.call() with a multi-turn loop:
 *   1. Build system prompt listing available tools
 *   2. Call LLM
 *   3. Parse reply for tool-call tags: <tool_call name="...">{"arg":"val"}</tool_call>
 *   4. Execute each tool via toolRunner.executeTool
 *   5. Append results back into context
 *   6. Re-call LLM with enriched context
 *   7. Loop until the LLM produces a final reply (no tool calls) or max iterations
 *
 * Uses an XML-tagged format so it works across ALL providers (gemini, openai,
 * anthropic, ollama) without depending on provider-specific function-calling APIs.
 */

import type { LLMMessage } from './adapters/types.js';
import { LLMGateway } from './llmGateway.js';
import db from '../../database.js';
import { executeTool } from './toolRunner.js';

const MAX_TOOL_ITERATIONS = 5;

export interface ChatbotTool {
  id: string;
  name: string;
  description: string;
  parameters_json: string;
  type: string;
  executor_json: string;
  data_source_id: string;
}

export interface DataSourceRow {
  id: string;
  config_json: string;
  workspace_id: string;
}

const TOOL_CALL_REGEX = /<tool_call\s+name="([^"]+)"\s*>([\s\S]*?)<\/tool_call>/g;

/**
 * Load tools attached to a chatbot (with their data sources).
 * Returns empty array if none attached.
 */
export function loadChatbotTools(chatbotId: string, workspaceId: string): ChatbotTool[] {
  const rows = db.prepare(`
    SELECT t.id, t.name, t.description, t.parameters_json, t.type, t.executor_json, t.data_source_id
    FROM chatbot_tools ct
    JOIN tools t ON t.id = ct.tool_id
    JOIN data_sources ds ON ds.id = t.data_source_id
    WHERE ct.chatbot_id = ? AND ct.enabled = 1 AND t.enabled = 1 AND ds.workspace_id = ?
  `).all(chatbotId, workspaceId) as unknown as ChatbotTool[];

  return rows;
}

/**
 * Build the tool-system-prompt section injected into the system message.
 * Tells the LLM what tools exist, their parameters, and how to call them.
 */
export function buildToolSystemPrompt(tools: ChatbotTool[]): string {
  if (tools.length === 0) return '';

  const toolDescriptions = tools.map((t) => {
    let params: Record<string, unknown> = {};
    try { params = JSON.parse(t.parameters_json); } catch { /* keep default */ }
    const properties = (params.properties ?? {}) as Record<string, { type?: string; description?: string }>;
    const required = (params.required ?? []) as string[];

    const paramList = Object.entries(properties)
      .map(([name, schema]) => {
        const req = required.includes(name) ? ' (required)' : '';
        const type = schema.type ?? 'any';
        const desc = schema.description ?? '';
        return `    - ${name} (${type}${req}): ${desc}`;
      })
      .join('\n');

    return `### ${t.name}\n${t.description}\nParameters:\n${paramList || '    (none)'}`;
  }).join('\n\n');

  return `
## Tools Available

You have access to the following tools. Use them when the user asks for data you don't know
(e.g. product details, customer info, order status). Call a tool by emitting a tool_call tag
with the tool name and JSON arguments. The system will execute the tool and give you the
result. You may call multiple tools in a single response.

Tool call format:
<tool_call name="tool_name">{"arg1":"value1","arg2":"value2"}</tool_call>

After receiving tool results, use them to answer the user's question. Do NOT fabricate data
— always call the tool first. If a tool returns null or no results, tell the user honestly.

${toolDescriptions}
`.trim();
}

/**
 * Parse an LLM reply for tool calls.
 * Returns the calls + the reply with tool calls stripped out.
 */
export function parseToolCalls(reply: string): {
  calls: Array<{ name: string; arguments: Record<string, unknown> }>;
  cleanedReply: string;
} {
  const calls: Array<{ name: string; arguments: Record<string, unknown> }> = [];
  let match: RegExpExecArray | null;

  TOOL_CALL_REGEX.lastIndex = 0;
  while ((match = TOOL_CALL_REGEX.exec(reply)) !== null) {
    const name = match[1]!;
    const argsText = match[2]!.trim();
    let args: Record<string, unknown> = {};
    if (argsText) {
      try { args = JSON.parse(argsText); } catch { args = { _raw: argsText }; }
    }
    calls.push({ name, arguments: args });
  }

  const cleanedReply = reply.replace(TOOL_CALL_REGEX, '').trim();
  return { calls, cleanedReply };
}

/**
 * Execute a parsed tool call by looking up the tool + its data source.
 */
async function executeToolCall(
  call: { name: string; arguments: Record<string, unknown> },
  tools: ChatbotTool[],
  workspaceId: string,
): Promise<string> {
  const tool = tools.find((t) => t.name === call.name);
  if (!tool) {
    return JSON.stringify({ error: `Unknown tool: ${call.name}` });
  }

  // Load the data source config
  const ds = db.prepare(`
    SELECT id, config_json, workspace_id FROM data_sources WHERE id = ? AND workspace_id = ?
  `).get(tool.data_source_id, workspaceId) as DataSourceRow | undefined;
  if (!ds) {
    return JSON.stringify({ error: `Data source not found for tool: ${call.name}` });
  }

  try {
    const result = await executeTool({
      tool: {
        id: tool.id,
        name: tool.name,
        type: tool.type,
        parameters_json: tool.parameters_json,
        executor_json: tool.executor_json,
        data_source_id: tool.data_source_id,
      },
      arguments: call.arguments,
      workspaceId,
    });
    return JSON.stringify(result);
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Full tool-calling loop.
 *
 * @returns The final LLM reply (no tool calls in it) + trace of tools executed.
 */
export async function callWithTools(
  gateway: LLMGateway,
  messages: LLMMessage[],
  tools: ChatbotTool[],
  baseSystemPrompt: string,
  workspaceId: string,
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<{ reply: string; confidence: number; toolCalls: Array<{ name: string; arguments: Record<string, unknown>; result: string }> }> {
  const toolCalls: Array<{ name: string; arguments: Record<string, unknown>; result: string }> = [];
  const toolSystemPrompt = buildToolSystemPrompt(tools);
  const fullSystemPrompt = toolSystemPrompt
    ? `${baseSystemPrompt}\n\n${toolSystemPrompt}`
    : baseSystemPrompt;

  let currentMessages = [...messages];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await gateway.call({
      messages: currentMessages,
      systemPrompt: fullSystemPrompt,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    });

    const { calls, cleanedReply } = parseToolCalls(response.reply);

    // No tool calls → we have the final answer
    if (calls.length === 0) {
      return { reply: response.reply, confidence: response.confidence, toolCalls };
    }

    // Record the LLM's tool-call reply in context
    currentMessages.push({ role: 'model', content: response.reply });

    // Execute each tool + append results
    for (const call of calls) {
      const result = await executeToolCall(call, tools, workspaceId);
      toolCalls.push({ name: call.name, arguments: call.arguments, result });
      currentMessages.push({
        role: 'user',
        content: `<tool_result name="${call.name}">${result}</tool_result>`,
      });
    }
  }

  // If we exhausted iterations, do one final call WITHOUT tools so the LLM
  // produces a final answer from what it already knows.
  const finalResponse = await gateway.call({
    messages: currentMessages,
    systemPrompt: baseSystemPrompt, // no tools → forces a text reply
    maxTokens: options.maxTokens,
    temperature: options.temperature,
  });

  return { reply: finalResponse.reply, confidence: finalResponse.confidence, toolCalls };
}