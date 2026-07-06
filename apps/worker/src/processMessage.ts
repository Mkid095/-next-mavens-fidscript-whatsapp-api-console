/**
 * Chatbot Worker — main message processor (orchestrator).
 * Delegates LLM call + response handling to processMessageLlm.ts.
 */

import db from '../database.js';
import { pickBestBot, evaluateTriggers } from '../modules/ai/chatbotEngine.js';
import { isOverrideActive } from './activeOverrideChecker.js';
import { insertTimelineMessage } from './timelineRecorder.js';
import { emitAiOverrideChanged } from '../utils/gateway.js';
import { getRuntimeConfig } from './chatbotRuntimeCache.js';
import { traceAsync, insertTrace, recordResponseMetadata, newId } from './tracing.js';
import { acquireConversationLock, releaseConversationLock } from './messageHandlerUtils.js';
import { buildLLMMessages, deriveIntent, loadBotConfig, runLlmCallAndSend } from './processMessageLlm.js';

export interface InboundMessage {
  id?: string;
  simulation?: boolean;
  conversationId: string;
  customerId: string;
  contactId?: string;
  workspaceId: string;
  instanceId: string;
  instanceName?: string;
  message: string;
  messageType: string;
  chatId: string;
  isGroup: boolean;
  senderName?: string;
  senderPhone?: string;
  groupJid?: string;
}

// ─── Override helpers ─────────────────────────────────────────────────────────

function checkOverrideAndResume(
  conversationId: string,
  workspaceId: string,
  instanceName: string | undefined,
  sim: boolean,
): { override: { conversation_id: string; mode: string; status: string; expires_at?: string | null; resume_policy?: string | null } | null; willResumeNextMessage: boolean } {
  const row = db.prepare(
    'SELECT conversation_id, mode, status, expires_at, resume_policy FROM chatbot_conversation_overrides WHERE conversation_id = ?',
  ).get(conversationId) as {
    conversation_id: string; mode: string; status: string;
    expires_at?: string | null; resume_policy?: string | null;
  } | undefined;

  if (!row) return { override: null, willResumeNextMessage: false };

  if (row.mode === 'manual' && row.status !== 'active') {
    console.log(`[worker] Conversation ${conversationId} override status=${row.status} — skipping AI`);
    return { override: null, willResumeNextMessage: false };
  }

  const active = isOverrideActive(row as Parameters<typeof isOverrideActive>[0]);
  if (row.mode === 'manual' && !active) {
    if (!sim) {
      db.prepare(
        `UPDATE chatbot_conversation_overrides SET status='expired', ended_at=?, ended_reason='timeout_expired' WHERE conversation_id=?`,
      ).run(new Date().toISOString(), row.conversation_id);
      insertTimelineMessage(conversationId, 'AI resumed automatically (override expired)', workspaceId);
      if (instanceName) emitAiOverrideChanged(instanceName, { chatId: conversationId, mode: 'ai' });
    } else {
      console.log(`[worker] SIMULATION — skipped expired override state update`);
    }
    console.log(`[worker] Override expired for ${conversationId} — AI resumed`);
  } else if (row.mode === 'manual') {
    console.log(`[worker] Conversation ${conversationId} has manual override — skipping AI`);
    return { override: null, willResumeNextMessage: false };
  }

  return { override: row, willResumeNextMessage: row.resume_policy === 'next_message' };
}

// ─── Non-AI action handlers ────────────────────────────────────────────────────

function handleSkipAction(botId: string, responseMessageId: string, evalResult: { trigger: { triggerId: string }; rule: { ruleId: string } }, sim: boolean): void {
  if (!sim) recordResponseMetadata({ messageId: responseMessageId, chatbotId: botId, confidence: 0, model: '', matchedTrigger: evalResult.trigger.triggerId, matchedRule: evalResult.rule.ruleId, skipReason: 'rule_skip' });
  console.log(`[worker] Rule matched: skip (no response)`);
}

function handleManualAction(botId: string, conversationId: string, responseMessageId: string, evalResult: { trigger: { triggerId: string }; rule: { ruleId: string } }, sim: boolean): void {
  if (!sim) recordResponseMetadata({ messageId: responseMessageId, chatbotId: botId, confidence: 0, model: '', matchedTrigger: evalResult.trigger.triggerId, matchedRule: evalResult.rule.ruleId, skipReason: 'handoff_active' });
  if (!sim) db.prepare(`INSERT OR REPLACE INTO conversation_states (conversation_id, state, updated_at) VALUES (?, 'WAITING_AGENT', CURRENT_TIMESTAMP)`).run(conversationId);
  else console.log(`[worker] SIMULATION — skipped handoff state write`);
  console.log(`[worker] Rule matched: manual handoff`);
}

function handleWorkflowAction(botId: string, responseMessageId: string, evalResult: { trigger: { triggerId: string }; rule: { ruleId: string } }, sim: boolean): void {
  if (!sim) recordResponseMetadata({ messageId: responseMessageId, chatbotId: botId, confidence: 0, model: '', matchedTrigger: evalResult.trigger.triggerId, matchedRule: evalResult.rule.ruleId, skipReason: 'workflow_stop' });
  console.log(`[worker] Rule matched: workflow (not yet implemented)`);
}

// ─── Main processor ────────────────────────────────────────────────────────────

export async function processMessage(msg: InboundMessage): Promise<void> {
  const { conversationId, workspaceId, instanceId, instanceName, message, messageType, chatId, isGroup, contactId, groupJid } = msg;
  const sim = msg.simulation === true;

  if (sim) console.log(`[worker] SIMULATION — processing message in conv=${conversationId} instance=${instanceId}`);
  if (messageType !== 'text') return;

  // 1. Conversation lock
  const { acquired, workerId } = acquireConversationLock(conversationId, sim);
  if (!acquired) {
    console.log(`[worker] Conversation ${conversationId} is locked — another worker is processing`);
    return;
  }

  try {
    // 2. Override check
    const { override, willResumeNextMessage } = checkOverrideAndResume(conversationId, workspaceId, instanceName, sim);

    // 3. Find the best bot
    const pickedBotId = pickBestBot(workspaceId, instanceId, message, contactId, conversationId, groupJid);
    if (!pickedBotId) { console.log(`[worker] No bot matched for message in conversation=${conversationId}`); return; }
    const botId = pickedBotId as string;

    const cached = getRuntimeConfig(botId);
    if (cached) console.log(`[worker] Using cached runtime config for bot ${botId} (v${cached.compiledVersion})`);
    else console.log(`[worker] No cached config for bot ${botId} — will load from versions`);

    const evalResult = evaluateTriggers(botId, message, { workspaceId, contactId, conversationId });
    const responseMessageId = newId();

    if (!sim) {
      insertTrace(conversationId, botId, workspaceId, 'trigger_eval', 0, {
        triggered: evalResult.shouldRespond,
        triggerId: evalResult.trigger.triggerId,
        matchedKeyword: evalResult.trigger.matchedKeyword,
        ruleAction: evalResult.rule.action,
        ruleName: evalResult.rule.ruleName,
      }, responseMessageId, msg.id ?? null);
    }

    if (!evalResult.shouldRespond) {
      if (!sim) recordResponseMetadata({ messageId: responseMessageId, chatbotId: botId, confidence: 0, model: '', matchedTrigger: evalResult.trigger.triggerId, matchedRule: evalResult.rule.ruleId, skipReason: evalResult.skipReason ?? 'no_trigger_matched' });
      else console.log(`[worker] SIMULATION — skipped trace + metadata for skipped response`);
      console.log(`[worker] Bot ${botId} did not trigger response: ${evalResult.skipReason}`);
      return;
    }

    const { rule } = evalResult;

    // 4. Non-AI actions
    if (rule.action === 'skip') { handleSkipAction(botId, responseMessageId, { trigger: { triggerId: evalResult.trigger.triggerId! }, rule: { ruleId: evalResult.rule.ruleId! } }, sim); return; }
    if (rule.action === 'manual') { handleManualAction(botId, conversationId, responseMessageId, { trigger: { triggerId: evalResult.trigger.triggerId! }, rule: { ruleId: evalResult.rule.ruleId! } }, sim); return; }
    if (rule.action === 'workflow') { handleWorkflowAction(botId, responseMessageId, { trigger: { triggerId: evalResult.trigger.triggerId! }, rule: { ruleId: evalResult.rule.ruleId! } }, sim); return; }

    // 5. Load bot config + build prompt
    const config = loadBotConfig(botId);
    if (!config) return;
    const { bot, aiConfig, policies } = config;

    const intent = deriveIntent(botId);
    const { messages: llmMessages, systemPrompt } = await buildLLMMessages(botId, conversationId, contactId ?? '', message, intent, aiConfig);

    // 6. Run LLM call + send reply
    const narrowedEvalResult = { trigger: { triggerId: evalResult.trigger.triggerId! }, rule: { ruleId: evalResult.rule.ruleId! } };
    await runLlmCallAndSend({
      botId, conversationId, workspaceId, instanceName, chatId, contactId: contactId ?? '',
      customerId: msg.customerId, message, sim, responseMessageId,
      llmMessages, systemPrompt, aiConfig, policies, bot,
      evalResult: narrowedEvalResult, willResumeNextMessage, override,
    });
  } catch (err) {
    console.error(`[worker] processMessage error:`, err);
  } finally {
    releaseConversationLock(conversationId, workerId);
    if (sim) console.log(`[worker] SIMULATION — replay completed successfully`);
  }
}
