import db, { saveDatabase } from '../../database.js';
import { loadMemory, formatMemoryContext } from './memoryService.js';
import { retrieveKnowledge, formatKnowledgeContext } from './knowledgeService.js';
import { routeIntent, type IntentDecision } from './intentRouter.js';

export interface PromptBuildResult {
  systemPrompt: string;
  messages: Array<{ role: 'system' | 'user' | 'model' | 'assistant'; content: string }>;
  tokenEstimate: number;
  versionId: string;
}

const SYSTEM_PROMPT_TEMPLATE = `You are a helpful AI assistant for a business.
Respond clearly, concisely, and helpfully. If you don't know something, say so honestly.
Never make up facts, prices, or availability.
If a user asks to speak to a human agent, say something like: "Let me connect you with a team member."`;

export async function buildPrompt(
  chatbotId: string,
  conversationId: string,
  contactId: string,
  latestMessage: string,
  intent: IntentDecision
): Promise<PromptBuildResult> {
  const aiConfig = db.prepare('SELECT * FROM chatbot_ai_configs WHERE chatbot_id = ?').get(chatbotId) as Record<string, unknown> | undefined;
  const bot = db.prepare('SELECT name FROM chatbot_configs WHERE id = ?').get(chatbotId) as { name: string } | undefined;
  const botName = String(bot?.name ?? 'Assistant');

  const capabilityInstructions = buildCapabilityInstructions(intent);
  const customSystem = String(aiConfig?.system_prompt ?? '').trim();
  const systemPrompt = [SYSTEM_PROMPT_TEMPLATE, customSystem, capabilityInstructions].filter(Boolean).join('\n\n');

  let knowledgeContext = '';
  if (intent.capabilities.includes('knowledge') && intent.knowledgeIds.length > 0) {
    const results = await retrieveKnowledge(chatbotId, latestMessage, 3);
    knowledgeContext = formatKnowledgeContext(results);
  }

  let memoryContext = '';
  if (intent.capabilities.includes('memory')) {
    const memory = loadMemory(conversationId, chatbotId);
    memoryContext = formatMemoryContext(memory);
  }

  const maxHistory = Number(aiConfig?.max_history_messages ?? 20) * 2;
  const historyRows = db.prepare(`
    SELECT from_name, content, direction, timestamp FROM inbox_messages
    WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT ?
  `).all(conversationId, maxHistory) as Array<{ from_name: string; content: string; direction: string; timestamp: string }>;

  const historyMessages: Array<{ role: 'system' | 'user' | 'model' | 'assistant'; content: string }> = [];
  for (const h of historyRows) {
    const role = h.direction === 'outgoing' ? 'model' : 'user';
    const label = h.from_name || (h.direction === 'outgoing' ? botName : 'User');
    historyMessages.push({ role, content: `[${label}]: ${h.content}` });
  }

  const messages: Array<{ role: 'system' | 'user' | 'model' | 'assistant'; content: string }> = [{ role: 'system', content: systemPrompt }];
  if (knowledgeContext) messages.push({ role: 'system', content: knowledgeContext });
  if (memoryContext) messages.push({ role: 'system', content: memoryContext });
  messages.push(...historyMessages, { role: 'user', content: latestMessage });

  const tokenEstimate = Math.ceil(messages.map(m => m.content).join(' ').length / 4);
  const versionId = await savePromptVersion(chatbotId, systemPrompt, latestMessage, messages.length);

  return { systemPrompt, messages, tokenEstimate, versionId };
}

function buildCapabilityInstructions(intent: IntentDecision): string {
  const parts: string[] = [];
  if (intent.capabilities.includes('knowledge')) parts.push('- Use the KNOWLEDGE BASE section above to answer factual questions. Do not guess.');
  if (intent.capabilities.includes('datasets')) parts.push('- If asked about products, prices, or availability, use the available dataset tools.');
  if (intent.capabilities.includes('tools')) parts.push('- You have access to tools. Use them when the user asks for specific data or actions.');
  if (intent.capabilities.includes('memory')) parts.push('- Use the MEMORY section to recall facts, preferences, or context from earlier in the conversation.');
  if (intent.intent === 'handoff') parts.push('- The user has requested a human agent. Respond by acknowledging and initiating a handoff.');
  if (intent.intent === 'greeting') parts.push('- This is a greeting. Respond warmly and briefly. Do not launch into long explanations.');
  if (parts.length === 0) parts.push('- Answer helpfully based on general knowledge.');
  return parts.join('\n');
}

async function savePromptVersion(chatbotId: string, systemPrompt: string, lastUserMessage: string, messageCount: number): Promise<string> {
  const id = `pv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const maxRow = db.prepare('SELECT MAX(version) as max_v FROM chatbot_prompt_versions WHERE chatbot_id = ?').get(chatbotId) as { max_v: number | null } | undefined;
  const version = (maxRow?.max_v ?? 0) + 1;
  try {
    db.prepare(`INSERT INTO chatbot_prompt_versions (id, chatbot_id, version, prompt_text, system_prompt_text, change_summary, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
      .run(id, chatbotId, version, lastUserMessage, systemPrompt, `Auto-snapshot v${version} (${messageCount} messages)`, 'system');
    saveDatabase();
  } catch (_) { /* non-fatal */ }
  return id;
}

export function getPromptVersions(chatbotId: string): Array<{ id: string; version: number; prompt_text: string; system_prompt_text: string; change_summary: string; created_at: string }> {
  return db.prepare(`SELECT id, version, prompt_text, system_prompt_text, change_summary, created_at FROM chatbot_prompt_versions WHERE chatbot_id = ? ORDER BY version DESC LIMIT 20`).all(chatbotId) as Array<{ id: string; version: number; prompt_text: string; system_prompt_text: string; change_summary: string; created_at: string }>;
}

export function rollbackPromptVersion(chatbotId: string, version: number): boolean {
  const row = db.prepare('SELECT system_prompt_text FROM chatbot_prompt_versions WHERE chatbot_id = ? AND version = ?').get(chatbotId, version) as { system_prompt_text: string } | undefined;
  if (!row) return false;
  db.prepare('UPDATE chatbot_ai_configs SET system_prompt = ?, updated_at = CURRENT_TIMESTAMP WHERE chatbot_id = ?').run(row.system_prompt_text, chatbotId);
  saveDatabase();
  return true;
}
