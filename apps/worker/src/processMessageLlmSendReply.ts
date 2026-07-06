/**
 * processMessage LLM send reply — handles response processing, DB insert, and fallback.
 * Extracted from processMessageLlmSend.ts to keep it under 150 lines.
 */

import db from '../database.js';
import { saveDatabase } from '../database/index.js';
import { requestHandoff } from '../modules/ai/handoffService.js';
import { traceAsync, recordResponseMetadata } from './tracing.js';
import { recordTokenDeduction } from './billingRecorder.js';
import { formatReplyForWhatsApp } from './responseFormatter.js';
import { insertTimelineMessage } from './timelineRecorder.js';
import { sendWhatsAppText } from './messageHandlerUtils.js';
import { emitAiOverrideChanged } from '../utils/gateway.js';

interface SendResult {
  reply: string;
  confidence: number;
  tokensUsed: { total: number };
  model: string | undefined;
}

export async function handleLlmResponse(
  opts: {
    conversationId: string;
    botId: string;
    workspaceId: string;
    instanceName: string | undefined;
    chatId: string;
    customerId: string;
    sim: boolean;
    responseMessageId: string;
    formattedReply: string;
    confidence: number;
    tokensUsed: { total: number };
    model: string | undefined;
    aiConfig: Record<string, unknown>;
    policies: Record<string, unknown>;
    bot: Record<string, unknown>;
    evalResult: { trigger: { triggerId: string }; rule: { ruleId: string } };
    willResumeNextMessage: boolean;
    override: Record<string, unknown> | null;
  },
): Promise<void> {
  const {
    conversationId, botId, workspaceId, instanceName, chatId, customerId,
    sim, responseMessageId, formattedReply, confidence, tokensUsed, model,
    aiConfig, policies, bot, evalResult, willResumeNextMessage, override,
  } = opts;

  const threshold = Number(policies?.confidence_threshold ?? 0.6);
  if (confidence < threshold) {
    if (!sim) recordResponseMetadata({
      messageId: responseMessageId,
      chatbotId: botId,
      confidence,
      model: model ?? String(aiConfig.model ?? 'gemini'),
      matchedTrigger: evalResult.trigger.triggerId,
      matchedRule: evalResult.rule.ruleId,
      skipReason: 'confidence_threshold',
    });
    console.log(`[worker] Low confidence ${confidence} < ${threshold} — escalating to human`);
    if (!sim) requestHandoff(conversationId, '', String(bot.name ?? 'Bot'));
    else console.log(`[worker] SIMULATION — skipped handoff request`);
    return;
  }

  if (formattedReply && instanceName) {
    if (!sim) {
      await traceAsync(
        conversationId, botId, workspaceId, 'response_send',
        () => sendWhatsAppText(instanceName, chatId, formattedReply),
        () => ({ triggered: true }),
        responseMessageId,
        null,
      );
    } else {
      console.log(`[worker] SIMULATION — skipped WhatsApp send`);
    }
    console.log(`[worker] Sent reply to ${chatId}: "${formattedReply.slice(0, 50)}..."`);
  }

  if (!sim) {
    db.prepare(`INSERT INTO inbox_messages
      (id, workspace_id, customer_id, conversation_id, from_number, from_name, message_type, content, media_url, is_read, timestamp, direction)
      VALUES (?, ?, ?, ?, ?, ?, 'text', ?, '', 1, datetime('now'), 'outgoing')`,
    ).run(responseMessageId, workspaceId, customerId, conversationId, chatId, String(bot.name ?? 'Bot'), formattedReply);
  }

  const botVersionRow = db.prepare(
    'SELECT MAX(version) as v FROM chatbot_versions WHERE chatbot_id = ? AND is_published = 1',
  ).get(botId) as { v: number | null } | undefined;
  const promptVersionRow = db.prepare(
    'SELECT MAX(version) as v FROM chatbot_prompt_versions WHERE chatbot_id = ?',
  ).get(botId) as { v: number | null } | undefined;
  const botVersion = botVersionRow?.v != null ? String(botVersionRow.v) : undefined;
  const promptVersion = promptVersionRow?.v != null ? String(promptVersionRow.v) : undefined;

  if (!sim) recordResponseMetadata({
    messageId: responseMessageId,
    chatbotId: botId,
    confidence,
    model: model ?? String(aiConfig.model ?? 'gemini'),
    promptVersion,
    botVersion,
    matchedTrigger: evalResult.trigger.triggerId,
    matchedRule: evalResult.rule.ruleId,
  });

  if (willResumeNextMessage && override) {
    if (!sim) {
      db.prepare(
        `UPDATE chatbot_conversation_overrides SET status='completed', ended_at=?, ended_reason='next_message_completed' WHERE conversation_id=?`,
      ).run(new Date().toISOString(), (override as { conversation_id: string }).conversation_id);
      insertTimelineMessage(conversationId, 'AI resumed automatically (one-shot manual)', workspaceId);
      if (instanceName) emitAiOverrideChanged(instanceName, { chatId: conversationId, mode: 'ai' });
    } else {
      console.log(`[worker] SIMULATION — skipped next_message override transition`);
    }
  }

  if (!sim) saveDatabase();
}

export async function sendFallback(
  instanceName: string | undefined,
  chatId: string,
  sim: boolean,
  policies: Record<string, unknown>,
): Promise<void> {
  if (!instanceName) return;
  const fallback = String(policies?.fallback_reply ?? 'Sorry, I could not process your request.');
  if (!sim) {
    await sendWhatsAppText(instanceName, chatId, fallback);
  } else {
    console.log(`[worker] SIMULATION — skipped fallback WhatsApp send`);
  }
}
