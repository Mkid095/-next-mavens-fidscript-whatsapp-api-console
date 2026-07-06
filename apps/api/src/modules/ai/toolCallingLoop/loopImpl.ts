/**
 * Tool-calling loop — executes tools in a multi-turn LLM loop.
 *
 * Parses tool_call XML tags from LLM replies, executes each tool,
 * and feeds results back into context until the LLM produces a
 * final reply (no tool calls) or max iterations are reached.
 */
import type { LLMMessage } from '../adapters/types.js';
import { LLMGateway } from '../llmGateway.js';
import db from '../../../database.js';
import { executeTool } from '../toolRunner.js';

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

async function executeToolCall(
  call: { name: string; arguments: Record<string, unknown> },
  tools: ChatbotTool[],
  workspaceId: string,
): Promise<string> {
  const tool = tools.find((t) => t.name === call.name);
  if (!tool) {
    return JSON.stringify({ error: `Unknown tool: ${call.name}` });
  }

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

export async function callWithTools(
  gateway: LLMGateway,
  messages: LLMMessage[],
  tools: ChatbotTool[],
  baseSystemPrompt: string,
  workspaceId: string,
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<{
  reply: string;
  confidence: number;
  toolCalls: Array<{ name: string; arguments: Record<string, unknown>; result: string }>;
  tokensUsed: { prompt: number; completion: number; total: number };
}> {
  const toolCalls: Array<{ name: string; arguments: Record<string, unknown>; result: string }> = [];
  let totalPrompt = 0;
  let totalCompletion = 0;

  let currentMessages = [...messages];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await gateway.call({
      messages: currentMessages,
      systemPrompt: baseSystemPrompt,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    });

    totalPrompt += response.tokensUsed.prompt;
    totalCompletion += response.tokensUsed.completion;

    const { calls } = parseToolCalls(response.reply);

    if (calls.length === 0) {
      return {
        reply: response.reply,
        confidence: response.confidence,
        toolCalls,
        tokensUsed: {
          prompt: totalPrompt,
          completion: totalCompletion,
          total: totalPrompt + totalCompletion,
        },
      };
    }

    currentMessages.push({ role: 'model', content: response.reply });

    for (const call of calls) {
      const result = await executeToolCall(call, tools, workspaceId);
      toolCalls.push({ name: call.name, arguments: call.arguments, result });
      currentMessages.push({
        role: 'user',
        content: `<tool_result name="${call.name}">${result}</tool_result>`,
      });
    }
  }

  // Exhausted iterations — final call WITHOUT tools to force a text reply
  const finalResponse = await gateway.call({
    messages: currentMessages,
    systemPrompt: baseSystemPrompt,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
  });

  totalPrompt += finalResponse.tokensUsed.prompt;
  totalCompletion += finalResponse.tokensUsed.completion;

  return {
    reply: finalResponse.reply,
    confidence: finalResponse.confidence,
    toolCalls,
    tokensUsed: {
      prompt: totalPrompt,
      completion: totalCompletion,
      total: totalPrompt + totalCompletion,
    },
  };
}
