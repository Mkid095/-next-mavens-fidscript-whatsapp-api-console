/**
 * conditionEvaluator.ts — condition evaluation for chatbot response rules.
 *
 * Evaluates a JSON array of conditions against an EvaluationContext.
 * Each condition checks a field path (contact.tag, conversation.state, etc.)
 * against an operator and value.
 */

import db from '../../database.js';
import { safeJsonParse } from './chatbotUtils.js';

export interface EvaluationContext {
  workspaceId: string;
  contactId?: string;
  conversationId?: string;
  mode?: 'production' | 'simulation';
}

interface Condition {
  field: string;
  operator: string;
  value: string;
}

export function evaluateConditions(conditionsJson: string, ctx: EvaluationContext): boolean {
  const conditions = safeJsonParse(conditionsJson) as Condition[] | null;
  if (!conditions || conditions.length === 0) return true; // No conditions = always match
  return conditions.every(cond => evaluateCondition(cond, ctx));
}

function evaluateCondition(cond: Condition, ctx: EvaluationContext): boolean {
  const { field, operator, value } = cond;
  const parts = field.split('.');

  let fieldValue: string | number | boolean = '';

  if (parts[0] === 'contact' && ctx.contactId) {
    const contact = db.prepare(
      'SELECT * FROM contacts WHERE id = ?'
    ).get(ctx.contactId) as Record<string, unknown> | undefined;
    if (!contact) return false;
    if (parts[1] === 'tag') {
      const tags = db.prepare(
        'SELECT t.name FROM customer_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.customer_id = ?'
      ).all(ctx.contactId) as { name: string }[];
      fieldValue = tags.map(t => t.name).join(',');
    } else if (parts[1] === 'type') {
      const msgs = db.prepare(
        'SELECT COUNT(*) as cnt FROM inbox_messages WHERE conversation_id IN (SELECT id FROM conversations WHERE customer_id = ?)'
      ).get(ctx.contactId) as { cnt: number };
      fieldValue = msgs.cnt > 0 ? 'existing' : 'new';
    } else if (parts[1] === 'vip') {
      const cust = db.prepare('SELECT vip FROM customers WHERE id = ?').get(ctx.contactId) as { vip: number } | undefined;
      fieldValue = cust?.vip ? 'true' : 'false';
    }
  } else if (parts[0] === 'conversation' && ctx.conversationId) {
    if (parts[1] === 'state') {
      const state = db.prepare('SELECT state FROM conversation_states WHERE conversation_id = ?').get(ctx.conversationId) as { state: string } | undefined;
      fieldValue = state?.state ?? 'BOT';
    }
  } else if (parts[0] === 'workspace') {
    if (parts[1] === 'hour') {
      fieldValue = new Date().getHours();
    }
  }

  return compareCondition(fieldValue, operator, value);
}

function compareCondition(fieldValue: string | number | boolean, operator: string, condValue: string): boolean {
  const fv = String(fieldValue).toLowerCase();
  const cv = condValue.toLowerCase();

  switch (operator) {
    case 'equals':       return fv === cv;
    case 'not_equals':   return fv !== cv;
    case 'contains':     return fv.includes(cv);
    case 'not_contains': return !fv.includes(cv);
    case 'starts_with':  return fv.startsWith(cv);
    case 'ends_with':    return fv.endsWith(cv);
    case 'gt':           return Number(fieldValue) > Number(condValue);
    case 'gte':          return Number(fieldValue) >= Number(condValue);
    case 'lt':           return Number(fieldValue) < Number(condValue);
    case 'lte':          return Number(fieldValue) <= Number(condValue);
    case 'in':           return cv.split(',').map(s => s.trim()).includes(fv);
    case 'not_in':       return !cv.split(',').map(s => s.trim()).includes(fv);
    case 'is_empty':     return fv === '' || fv === 'null' || fv === 'undefined';
    case 'is_not_empty': return fv !== '' && fv !== 'null' && fv !== 'undefined';
    default:             return false;
  }
}
