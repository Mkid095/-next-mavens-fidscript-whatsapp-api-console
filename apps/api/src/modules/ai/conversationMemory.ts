/**
 * conversationMemory.ts — message history management + token budgeting.
 *
 * Handles the short-term memory layer (trimmed message history) used
 * by the context builder.
 */

import { loadMemory, formatMemoryContext } from './memoryService.js';
import { retrieveKnowledge, formatKnowledgeContext } from './knowledgeService.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuildContextOptions {
  chatbotId: string;
  workspaceId: string;
  conversationId: string;
  contactId?: string;
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  maxHistoryMessages?: number; // default 20
  forceProvider?: string;      // override provider selection
  forceConnectionId?: string;  // use specific connection
}

export interface BuiltContext {
  /** Messages ready to send (trimmed to token budget) */
  messages: Array<{ role: string; content: string }>;
  /** System prompt with memory + knowledge injected */
  systemPrompt: string;
  /** Token budget used by this context */
  tokenBudget: TokenBudget;
}

export interface TokenBudget {
  systemPromptTokens: number;
  historyTokens: number;
  availableForResponse: number;
  totalContextWindow: number;
}

/** Rough token estimate: ~4 chars per token for English text */
export const CHARS_PER_TOKEN = 4;

// ─── Core Builder ─────────────────────────────────────────────────────────────

/**
 * Build a complete LLM-ready context for a chatbot conversation.
 *
 * 1. Loads memory (short-term + long-term + facts + preferences)
 * 2. Searches relevant knowledge
 * 3. Builds system prompt with injected context
 * 4. Trims message history to fit token budget
 */
export async function buildContext(options: BuildContextOptions): Promise<BuiltContext> {
  const {
    chatbotId,
    conversationId,
    systemPrompt,
    messages,
    maxHistoryMessages = 20,
  } = options;

  // Load memory
  const memory = loadMemory(conversationId, chatbotId);

  // Load knowledge relevant to last message (RAG-style)
  const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
  const knowledgeResults = lastMessage.length > 3
    ? await retrieveKnowledge(chatbotId, lastMessage, 3)
    : [];

  // Build injected system context
  const memoryContext = formatMemoryContext(memory);
  const knowledgeContext = knowledgeResults.length > 0
    ? `\n--- KNOWLEDGE BASE ---\n${formatKnowledgeContext(knowledgeResults)}\n--- END KNOWLEDGE ---\n`
    : '';

  // Estimate system prompt tokens
  const systemInjection = memoryContext + knowledgeContext;
  const systemPromptTokens = Math.ceil((systemPrompt.length + systemInjection.length) / CHARS_PER_TOKEN);
  const totalContextWindow = 4096; // resolved by caller from llmConfig
  const maxResponseTokens = 1024;  // resolved by caller from llmConfig
  const availableForHistory = totalContextWindow - systemPromptTokens - maxResponseTokens;

  // Trim message history to fit token budget
  const trimmedMessages = trimMessageHistory(messages, availableForHistory, maxHistoryMessages);
  const historyTokens = Math.ceil(trimmedMessages.reduce((sum, m) => sum + m.content.length, 0) / CHARS_PER_TOKEN);

  return {
    messages: trimmedMessages,
    systemPrompt: systemPrompt + memoryContext + knowledgeContext,
    tokenBudget: {
      systemPromptTokens,
      historyTokens,
      availableForResponse: maxResponseTokens,
      totalContextWindow,
    },
  };
}

// ─── History Trimming ─────────────────────────────────────────────────────────

/**
 * Trim message history to fit within token budget, keeping most recent messages.
 */
export function trimMessageHistory(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  maxMessages: number
): Array<{ role: string; content: string }> {
  const recent = messages.slice(-maxMessages);
  let usedTokens = 0;
  const result: Array<{ role: string; content: string }> = [];

  for (let i = recent.length - 1; i >= 0; i--) {
    const msgTokens = Math.ceil(recent[i].content.length / CHARS_PER_TOKEN);
    if (usedTokens + msgTokens > maxTokens) break;
    result.unshift(recent[i]);
    usedTokens += msgTokens;
  }

  return result;
}
