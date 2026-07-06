/**
 * processMessage LLM implementation — buildLLMMessages, deriveIntent, loadBotConfig.
 * @see processMessageLlmSend.ts for runLlmCallAndSend
 * @see processMessageLlm.ts for the barrel
 */

import db from '../database.js';
import { buildPrompt } from '../modules/ai/promptService.js';

export async function buildLLMMessages(
  botId: string,
  conversationId: string,
  contactId: string,
  message: string,
  intent: {
    intent: 'general';
    confidence: number;
    reasoning: string;
    capabilities: Array<'memory' | 'knowledge' | 'tools' | 'datasets'>;
    suggestedMaxTokens: number;
    knowledgeIds: string[];
    datasetIds: string[];
    toolIds: string[];
  },
  aiConfig: Record<string, unknown>,
): Promise<{
  messages: Array<{ role: 'system' | 'user' | 'model' | 'assistant'; content: string }>;
  systemPrompt: string;
}> {
  try {
    const built = await buildPrompt(botId as string, conversationId as string, contactId ?? '', message, intent);
    return {
      messages: built.messages as Array<{ role: 'system' | 'user' | 'model' | 'assistant'; content: string }>,
      systemPrompt: built.systemPrompt,
    };
  } catch (e) {
    console.warn('[worker] buildPrompt failed, falling back to simple prompt:', String(e));
    const systemPrompt = String(aiConfig.system_prompt ?? '');
    const messages: Array<{ role: 'system' | 'user' | 'model' | 'assistant'; content: string }> = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    const history = db.prepare(`
      SELECT content, direction FROM inbox_messages
      WHERE conversation_id = ?
      ORDER BY timestamp ASC
      LIMIT ${Number(aiConfig.max_history_messages ?? 20) * 2}
    `).all(conversationId) as Array<{ content: string; direction: string }>;
    for (const h of history) {
      messages.push({ role: h.direction === 'outgoing' ? 'model' : 'user', content: h.content });
    }
    messages.push({ role: 'user', content: message });
    return { messages, systemPrompt };
  }
}

export function deriveIntent(botId: string) {
  const capRows = db.prepare(
    "SELECT capability FROM chatbot_capabilities WHERE chatbot_id = ? AND enabled = 1",
  ).all(botId) as Array<{ capability: string }>;
  return {
    intent: 'general' as const,
    confidence: 1,
    reasoning: 'capability-based fallback',
    capabilities: capRows.map((r) => r.capability) as Array<'memory' | 'knowledge' | 'tools' | 'datasets'>,
    suggestedMaxTokens: 1024,
    knowledgeIds: [] as string[],
    datasetIds: [] as string[],
    toolIds: [] as string[],
  };
}

export function loadBotConfig(botId: string) {
  const bot = db.prepare('SELECT * FROM chatbot_configs WHERE id = ?').get(botId) as Record<string, unknown> | undefined;
  if (!bot) return null;
  const aiConfig = db.prepare('SELECT * FROM chatbot_ai_configs WHERE chatbot_id = ?').get(botId) as Record<string, unknown> | undefined;
  if (!aiConfig) return null;
  const policies = db.prepare('SELECT * FROM chatbot_response_policies WHERE chatbot_id = ?').get(botId) as Record<string, unknown> | undefined;
  if (!policies) return null;
  return { bot: bot as Record<string, unknown>, aiConfig: aiConfig as Record<string, unknown>, policies: policies as Record<string, unknown> };
}
