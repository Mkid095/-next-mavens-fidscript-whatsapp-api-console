/**
 * chatbotUtils.ts — shared utilities for the chatbot module.
 */

/**
 * Safe JSON parse — returns null on failure instead of throwing.
 */
export function safeJsonParse(str: string): unknown {
  try { return JSON.parse(str); } catch { return null; }
}
