/**
 * triggerEvaluator.ts — trigger matching logic.
 */
import type { TriggerResult } from './chatbotEngineImpl.js';

export function matchKeyword(keyword: string, lowerMessage: string, mode: string): boolean {
  const kw = keyword.toLowerCase();
  switch (mode) {
    case 'exact':        return lowerMessage === kw;
    case 'starts_with':  return lowerMessage.startsWith(kw);
    case 'regex': {
      try { return new RegExp(kw, 'i').test(lowerMessage); } catch { return false; }
    }
    case 'contains': default: return lowerMessage.includes(kw);
  }
}
