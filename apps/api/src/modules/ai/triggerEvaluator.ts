/**
 * triggerEvaluator.ts — keyword/regex/always trigger matching.
 */

import db from '../../database.js';

export interface TriggerResult {
  triggered: boolean;
  triggerId?: string;
  triggerType?: string;
  triggerValue?: string;
  matchedKeyword?: string;
  confidence: number;
  requiresPreviousBotReply: boolean;
  satisfied: boolean;
}

// ─── Trigger Matching ─────────────────────────────────────────────────────────

export function matchTrigger(
  triggers: Record<string, unknown>[],
  message: string,
  conversationId?: string
): TriggerResult {
  const lower = message.toLowerCase().trim();

  for (const t of triggers) {
    const triggerType = String(t.trigger_type);
    const triggerValue = String(t.trigger_value ?? '');
    const keywordMode = String(t.keyword_mode ?? 'contains');
    const requirePrev = Boolean(t.require_previous_bot_reply);

    let satisfied = true;
    if (requirePrev && conversationId) {
      const lastBot = db.prepare(`
        SELECT direction FROM inbox_messages
        WHERE conversation_id = ? AND direction = 'outgoing'
        ORDER BY timestamp DESC LIMIT 1
      `).get(conversationId) as { direction: string } | undefined;
      satisfied = Boolean(lastBot);
    }

    let triggered = false;
    let confidence = 0.8;
    let matchedKeyword: string | undefined;

    switch (triggerType) {
      case 'keyword': {
        triggered = matchKeyword(triggerValue, lower, keywordMode);
        if (triggered) { matchedKeyword = triggerValue; confidence = 0.95; }
        break;
      }
      case 'regex': {
        try {
          const re = new RegExp(triggerValue, 'i');
          triggered = re.test(message);
          if (triggered) confidence = 0.95;
        } catch { triggered = false; }
        break;
      }
      case 'mention': {
        triggered = lower.includes('@bot') || lower.includes('@assistant');
        confidence = 0.9;
        break;
      }
      case 'first_message': {
        if (!conversationId) break;
        const count = db.prepare(
          'SELECT COUNT(*) as cnt FROM inbox_messages WHERE conversation_id = ?'
        ).get(conversationId) as { cnt: number };
        triggered = count.cnt === 0;
        confidence = 1.0;
        break;
      }
      case 'always': {
        triggered = true;
        confidence = 1.0;
        break;
      }
      case 'intent': {
        triggered = false;
        confidence = 0;
        break;
      }
      case 'webhook': {
        triggered = false;
        confidence = 0;
        break;
      }
    }

    if (triggered) {
      return {
        triggered: true,
        triggerId: String(t.id),
        triggerType,
        triggerValue,
        matchedKeyword,
        confidence,
        requiresPreviousBotReply: requirePrev,
        satisfied,
      };
    }
  }

  return { triggered: false, confidence: 0, requiresPreviousBotReply: false, satisfied: true };
}

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
