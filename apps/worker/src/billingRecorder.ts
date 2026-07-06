/**
 * Billing Recorder — token deduction after a successful AI response.
 *
 * Called once the LLM has replied and before the WhatsApp send.
 * Looks up the workspace_id from the chatbot config so usage is scoped correctly.
 */
import db from '../database.js';
import { logTokenUsage } from './billing.js';

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export function recordTokenDeduction(
  chatbotId: string,
  conversationId: string,
  model: string,
  usage: TokenUsage,
): void {
  logTokenUsage(
    chatbotId,
    conversationId,
    model,
    usage.prompt,
    usage.completion,
    usage.total,
  );
}
