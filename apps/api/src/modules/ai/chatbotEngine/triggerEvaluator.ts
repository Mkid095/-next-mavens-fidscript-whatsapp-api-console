/**
 * triggerEvaluator.ts — trigger matching logic.
 *
 * Moved from chatbotEngine.ts to enable independent testing of trigger matching.
 *
 * Public exports:
 *   matchKeyword()
 *   matchTrigger() — internal use only, exported for testing
 */

import type { TriggerResult } from './index.js';

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
