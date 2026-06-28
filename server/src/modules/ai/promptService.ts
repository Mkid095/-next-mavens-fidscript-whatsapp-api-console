/**
 * Prompt Generator + Versioning
 *
 * Builds the full prompt for each LLM call by stacking:
 *   1. Bot system prompt (from chatbot_ai_configs)
 *   2. Capability instructions (memory, knowledge, tools)
 *   3. Conversation history (loaded from inbox_messages)
 *   4. Injected context (memory, knowledge results)
 *
 * Prompt versions are snapshotted on every significant edit so any
 * version can be reviewed, rolled back, or compared.
 */
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
Respond clearly, concisely, and helpfully.
If you don't know something, say so honestly.
Never make up facts, prices, or availability.
If a user asks to speak to a human agent, say something like: "Let me connect you with a team member."`;

/**
 * Build the full prompt stack for a chatbot turn.
 */
export async function buildPrompt(
  chatbotId: string,
  conversationId: string,
  contactId: string,
  latestMessage: string,
  intent: IntentDecision
): Promise<PromptBuildResult> {
  // 1. Load AI config
  const aiConfig = db.prepare(
    'SELECT * FROM chatbot_ai_configs WHERE chatbot_id = ?'
  ).get(chatbotId) as Record<string, unknown> | undefined;

  const bot = db.prepare('SELECT name FROM chatbot_configs WHERE id = ?').get(chatbotId) as { name: string } | undefined;
  const botName = String(bot?.name ?? 'Assistant');

  // 2. Build capability instructions
  const capabilityInstructions = buildCapabilityInstructions(chatbotId, intent);

  // 3. Build system prompt
  const customSystem = String(aiConfig?.system_prompt ?? '').trim();
  const systemPrompt = [
    SYSTEM_PROMPT_TEMPLATE,
    customSystem,
    capabilityInstructions,
  ].filter(Boolean).join('\n\n');

  // 4. Inject knowledge if needed
  let knowledgeContext = '';
  if (intent.capabilities.includes('knowledge') && intent.knowledgeIds.length > 0) {
    const knowledgeResults = await retrieveKnowledge(chatbotId, latestMessage, 3);
    knowledgeContext = formatKnowledgeContext(knowledgeResults);
  }

  // 5. Inject memory if needed
  let memoryContext = '';
  if (intent.capabilities.includes('memory')) {
    const memory = loadMemory(conversationId, chatbotId);
    memoryContext = formatMemoryContext(memory);
  }

  // 6. Load conversation history
  const maxHistory = Number(aiConfig?.max_history_messages ?? 20) * 2;
  const historyRows = db.prepare(`
    SELECT from_name, content, direction, timestamp
    FROM inbox_messages
    WHERE conversation_id = ?
    ORDER BY timestamp ASC
    LIMIT ?
  `).all(conversationId, maxHistory) as Array<{
    from_name: string;
    content: string;
    direction: string;
    timestamp: string;
  }>;

  const historyMessages: Array<{ role: 'system' | 'user' | 'model' | 'assistant'; content: string }> = [];
  for (const h of historyRows) {
    const role = h.direction === 'outgoing' ? 'model' : 'user';
    const label = h.from_name || (h.direction === 'outgoing' ? botName : 'User');
    historyMessages.push({ role, content: `[${label}]: ${h.content}` });
  }

  // 7. Build final messages array
  const messages: Array<{ role: 'system' | 'user' | 'model' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  if (knowledgeContext) messages.push({ role: 'system', content: knowledgeContext });
  if (memoryContext) messages.push({ role: 'system', content: memoryContext });

  messages.push(...historyMessages);
  messages.push({ role: 'user', content: latestMessage });

  // 8. Estimate tokens
  const tokenEstimate = estimateTokens(messages.map(m => m.content).join(' '));

  // 9. Save a prompt version snapshot (async, non-blocking)
  const versionId = await savePromptVersion(chatbotId, systemPrompt, latestMessage, messages.length);

  return { systemPrompt, messages, tokenEstimate, versionId };
}

function buildCapabilityInstructions(chatbotId: string, intent: IntentDecision): string {
  const parts: string[] = [];

  if (intent.capabilities.includes('knowledge')) {
    parts.push('- Use the KNOWLEDGE BASE section above to answer factual questions. Do not guess.');
  }

  if (intent.capabilities.includes('datasets')) {
    parts.push('- If asked about products, prices, or availability, use the available dataset tools.');
  }

  if (intent.capabilities.includes('tools')) {
    parts.push('- You have access to tools. Use them when the user asks for specific data or actions.');
  }

  if (intent.capabilities.includes('memory')) {
    parts.push('- Use the MEMORY section to recall facts, preferences, or context from earlier in the conversation.');
  }

  if (intent.intent === 'handoff') {
    parts.push('- The user has requested a human agent. Respond by acknowledging and initiating a handoff.');
  }

  if (intent.intent === 'greeting') {
    parts.push('- This is a greeting. Respond warmly and briefly. Do not launch into long explanations.');
  }

  if (parts.length === 0) {
    parts.push('- Answer helpfully based on general knowledge.');
  }

  return parts.join('\n');
}

function estimateTokens(text: string): number {
  // Rough chars-per-token estimate
  return Math.ceil(text.length / 4);
}

/**
 * Save a prompt version snapshot for rollback/history.
 */
async function savePromptVersion(
  chatbotId: string,
  systemPrompt: string,
  lastUserMessage: string,
  messageCount: number
): Promise<string> {
  const id = `pv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Get current max version
  const maxRow = db.prepare(
    'SELECT MAX(version) as max_v FROM chatbot_prompt_versions WHERE chatbot_id = ?'
  ).get(chatbotId) as { max_v: number | null } | undefined;
  const version = (maxRow?.max_v ?? 0) + 1;

  try {
    db.prepare(`INSERT INTO chatbot_prompt_versions
      (id, chatbot_id, version, prompt_text, system_prompt_text, change_summary, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(id, chatbotId, version, lastUserMessage, systemPrompt, `Auto-snapshot v${version} (${messageCount} messages)`, 'system');
    saveDatabase();
  } catch (_) { /* non-fatal */ }

  return id;
}

/**
 * Get prompt version history for a chatbot.
 */
export function getPromptVersions(chatbotId: string): Array<{
  id: string; version: number; prompt_text: string;
  system_prompt_text: string; change_summary: string; created_at: string;
}> {
  return db.prepare(`
    SELECT id, version, prompt_text, system_prompt_text, change_summary, created_at
    FROM chatbot_prompt_versions
    WHERE chatbot_id = ?
    ORDER BY version DESC
    LIMIT 20
  `).all(chatbotId) as Array<{
    id: string; version: number; prompt_text: string;
    system_prompt_text: string; change_summary: string; created_at: string;
  }>;
}

/**
 * Roll back to a specific prompt version.
 */
export function rollbackPromptVersion(chatbotId: string, version: number): boolean {
  const row = db.prepare(
    'SELECT system_prompt_text FROM chatbot_prompt_versions WHERE chatbot_id = ? AND version = ?'
  ).get(chatbotId, version) as { system_prompt_text: string } | undefined;
  if (!row) return false;

  db.prepare(
    'UPDATE chatbot_ai_configs SET system_prompt = ?, updated_at = CURRENT_TIMESTAMP WHERE chatbot_id = ?'
  ).run(row.system_prompt_text, chatbotId);
  saveDatabase();
  return true;
}
