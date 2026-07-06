/**
 * processMessage LLM send — runLlmCallAndSend orchestration.
 * @see processMessageLlmImpl.ts for buildLLMMessages, deriveIntent, loadBotConfig
 * @see processMessageLlmSendReply.ts for response handling
 * @see processMessageLlm.ts for the barrel
 */

import { LLMGateway } from '../modules/ai/llmGateway.js';
import { loadChatbotTools } from '../modules/ai/toolCallingEngine.js';
import { traceAsync } from './tracing.js';
import { recordTokenDeduction } from './billingRecorder.js';
import { executeToolsAndCall } from './toolExecutor.js';
import { formatReplyForWhatsApp } from './responseFormatter.js';
import { handleLlmResponse, sendFallback } from './processMessageLlmSendReply.js';

export async function runLlmCallAndSend(
  opts: {
    botId: string;
    conversationId: string;
    workspaceId: string;
    instanceName: string | undefined;
    chatId: string;
    contactId: string;
    customerId: string;
    message: string;
    sim: boolean;
    responseMessageId: string;
    llmMessages: Array<{ role: 'system' | 'user' | 'model' | 'assistant'; content: string }>;
    systemPrompt: string;
    aiConfig: Record<string, unknown>;
    policies: Record<string, unknown>;
    bot: Record<string, unknown>;
    evalResult: { trigger: { triggerId: string }; rule: { ruleId: string } };
    willResumeNextMessage: boolean;
    override: Record<string, unknown> | null;
  },
): Promise<void> {
  const {
    botId, conversationId, workspaceId, instanceName, chatId, contactId,
    customerId, sim, responseMessageId, llmMessages, systemPrompt,
    aiConfig, policies, bot, evalResult, willResumeNextMessage, override,
  } = opts;

  try {
    const gateway = LLMGateway.resolve(botId, workspaceId);
    const attachedTools = loadChatbotTools(botId, workspaceId);

    const response = await traceAsync(
      conversationId, botId, workspaceId, 'llm_call',
      async () => {
        if (attachedTools.length > 0) {
          return await executeToolsAndCall(
            gateway, llmMessages, systemPrompt, workspaceId, botId, conversationId,
            { maxTokens: Number(aiConfig.max_tokens ?? 2048), temperature: Number(aiConfig.temperature ?? 0.7) },
          );
        }
        return gateway.call({
          messages: llmMessages,
          systemPrompt,
          maxTokens: Number(aiConfig.max_tokens ?? 2048),
          temperature: Number(aiConfig.temperature ?? 0.7),
        });
      },
      (r) => ({ tokenCount: r.tokensUsed.total }),
      responseMessageId,
      null,
    );

    const { reply, confidence, tokensUsed, model } = response;
    const formattedReply = formatReplyForWhatsApp(reply);

    if (!sim) recordTokenDeduction(botId, conversationId, model ?? String(aiConfig.model ?? 'gemini'), tokensUsed);

    await handleLlmResponse({
      conversationId, botId, workspaceId, instanceName, chatId, customerId,
      sim, responseMessageId, formattedReply, confidence, tokensUsed, model,
      aiConfig, policies, bot, evalResult, willResumeNextMessage, override,
    });
  } catch (err) {
    console.error(`[worker] LLM call failed:`, err);
    await sendFallback(instanceName, chatId, sim, policies);
  }
}
