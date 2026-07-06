/**
 * Tool Executor — tool ranking and execution within the LLM call loop.
 *
 * Exports a single entry point that:
 *   1. Ranks attached tools via the tool-calling engine
 *   2. Calls the LLM with tools via callWithTools
 *   3. Logs each individual tool call to chatbot_tool_logs for traceability
 *
 * The circuit-breaker state is checked inside executeToolCall (tools.ts) so
 * tool-level failures are isolated without affecting the LLM call.
 */
import { LLMGateway } from '../modules/ai/llmGateway.js';
import { loadChatbotTools, callWithTools, type ChatbotTool } from '../modules/ai/toolCallingEngine.js';
import { logChatbotToolCall } from './tools.js';

export interface LLMCallOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface ToolCallResult {
  reply: string;
  confidence: number;
  tokensUsed: { prompt: number; completion: number; total: number };
  model: string;
}

/**
 * Load tools for a chatbot, call the LLM with them (tool-calling loop),
 * log each tool invocation, and return the final reply + metadata.
 */
export async function executeToolsAndCall(
  gateway: LLMGateway,
  llmMessages: Array<{ role: 'system' | 'user' | 'model' | 'assistant'; content: string }>,
  baseSystemPrompt: string,
  workspaceId: string,
  botId: string,
  conversationId: string,
  options: LLMCallOptions = {},
): Promise<ToolCallResult> {
  const attachedTools = loadChatbotTools(botId, workspaceId);

  if (attachedTools.length === 0) {
    // No tools — caller should use gateway.call() directly
    return { reply: '', confidence: 0, tokensUsed: { prompt: 0, completion: 0, total: 0 }, model: gateway.model };
  }

  const result = await callWithTools(
    gateway,
    llmMessages,
    attachedTools,
    baseSystemPrompt,
    workspaceId,
    {
      maxTokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
    },
  );

  // Log each tool call for traceability (non-fatal if logging fails)
  for (const tc of result.toolCalls) {
    try {
      logChatbotToolCall(
        {
          chatbotId: botId,
          conversationId,
          toolId: tc.name,
          toolName: tc.name,
          toolType: 'agent',
          config: {},
          input: tc.arguments,
        } as Parameters<typeof logChatbotToolCall>[0],
        { success: true, data: JSON.parse(tc.result) } as unknown as Parameters<typeof logChatbotToolCall>[1],
        0,
      );
    } catch {
      // traceability only — don't break the loop
    }
  }

  return {
    reply: result.reply,
    confidence: result.confidence,
    tokensUsed: result.tokensUsed,
    model: gateway.model,
  };
}
