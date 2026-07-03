/**
 * chatbotEngine.ts — trigger evaluation + rule engine
 *
 * Pipeline:
 *   1. findMatchingBots  — which chatbots are eligible for this message
 *   2. evaluateTriggers  — does any trigger fire?
 *   3. determineAction   — apply response rules (conditions → action)
 *   4. buildContext      — load conversation + contact + memory state
 */

import db from '../../database.js';

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface RuleResult {
  matched: boolean;
  ruleId?: string;
  ruleName?: string;
  action: 'ai' | 'manual' | 'skip' | 'workflow';
  actionConfig: Record<string, unknown>;
  conditionsJson?: string;
}

export interface EvaluationContext {
  workspaceId: string;
  contactId?: string;
  conversationId?: string;
}

export interface EvaluationResult {
  botId: string;
  trigger: TriggerResult;
  rule: RuleResult;
  conversationState: string;
  isHandoff: boolean;
  shouldRespond: boolean;
  replyText?: string;
}

// ─── Trigger Evaluation ───────────────────────────────────────────────────────

export function evaluateTriggers(
  botId: string,
  message: string,
  ctx: EvaluationContext
): EvaluationResult {
  const bot = db.prepare(
    'SELECT * FROM chatbot_configs WHERE id = ? AND workspace_id = ? AND enabled = 1'
  ).get(botId, ctx.workspaceId) as Record<string, unknown> | undefined;
  if (!bot) {
    return { botId, trigger: { triggered: false, confidence: 0, requiresPreviousBotReply: false, satisfied: true }, rule: { matched: false, action: 'skip', actionConfig: {}, conditionsJson: '[]' }, conversationState: 'CLOSED', isHandoff: false, shouldRespond: false };
  }

  // Load triggers ordered by priority
  const triggers = db.prepare(`
    SELECT * FROM chatbot_triggers
    WHERE chatbot_id = ? AND enabled = 1
    ORDER BY priority DESC
  `).all(botId) as Record<string, unknown>[];

  const triggerResult = matchTrigger(triggers, message, ctx.conversationId);

  // Load conversation state if we have one
  let conversationState = 'BOT';
  if (ctx.conversationId) {
    const stateRow = db.prepare(
      'SELECT state FROM conversation_states WHERE conversation_id = ?'
    ).get(ctx.conversationId) as { state: string } | undefined;
    if (stateRow) conversationState = stateRow.state;
  }

  // If conversation is closed/agent, don't respond
  if (['CLOSED', 'AGENT'].includes(conversationState) && triggerResult.triggerType !== 'always') {
    return { botId, trigger: triggerResult, rule: { matched: false, action: 'skip', actionConfig: {} }, conversationState, isHandoff: false, shouldRespond: false };
  }

  // Apply response rules
  const ruleResult = evaluateRules(botId, ctx);

  // Check for handoff conditions
  const isHandoff = ruleResult.action === 'manual' || triggerResult.triggerType === 'handoff';

  const shouldRespond = triggerResult.triggered
    && ruleResult.action !== 'skip'
    && triggerResult.satisfied;

  return {
    botId,
    trigger: triggerResult,
    rule: ruleResult,
    conversationState,
    isHandoff,
    shouldRespond,
  };
}

function matchTrigger(
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
      // Check if last message in conversation was from bot
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
        // Placeholder — intent classification ships in Sprint 2
        triggered = false;
        confidence = 0;
        break;
      }
      case 'webhook': {
        // External trigger — handled by NATS worker
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

function matchKeyword(keyword: string, lowerMessage: string, mode: string): boolean {
  const kw = keyword.toLowerCase();
  switch (mode) {
    case 'exact':   return lowerMessage === kw;
    case 'starts_with': return lowerMessage.startsWith(kw);
    case 'regex': {
      try { return new RegExp(kw, 'i').test(lowerMessage); } catch { return false; }
    }
    case 'contains': default: return lowerMessage.includes(kw);
  }
}

// ─── Rule Engine ──────────────────────────────────────────────────────────────

export function evaluateRules(
  botId: string,
  ctx: EvaluationContext
): RuleResult {
  const rules = db.prepare(`
    SELECT * FROM chatbot_response_rules
    WHERE chatbot_id = ? AND enabled = 1
    ORDER BY priority DESC
  `).all(botId) as Record<string, unknown>[];

  for (const rule of rules) {
    const conditionsJson = String(rule.conditions_json ?? '[]');
    const matched = evaluateConditions(conditionsJson, ctx);
    if (matched) {
      return {
        matched: true,
        ruleId: String(rule.id),
        ruleName: String(rule.name),
        action: String(rule.action) as RuleResult['action'],
        actionConfig: safeJsonParse(String(rule.action_config_json ?? '{}')) as Record<string, unknown>,
        conditionsJson,
      };
    }
  }

  // Default: if triggers matched but no rule, fall back to AI
  return { matched: false, action: 'ai', actionConfig: {}, conditionsJson: '[]' };
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

  // Field paths: contact.tag, contact.type, contact.vip, conversation.state, workspace.hour
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

// ─── Bot Lookup for Inbound Messages ──────────────────────────────────────────

/**
 * Resolves per-contact routing mode: 'ai' | 'manual' | 'disabled'.
 * Returns null if no per-contact override is set.
 */
function getContactRoutingMode(contactId: string, botId: string): string | null {
  const row = db.prepare(
    `SELECT mode FROM chatbot_contact_assignments WHERE contact_id = ? AND chatbot_id = ?`
  ).get(contactId, botId) as { mode: string } | undefined;
  return row?.mode ?? null;
}

export type GroupRespondMode = 'mention_only' | 'keyword_trigger' | 'admin_only' | 'disabled' | 'allow_all';

/**
 * Resolves per-group respond mode for a bot: 'mention_only' | 'keyword_trigger' | 'admin_only' | 'disabled' | 'allow_all'.
 * Returns 'allow_all' if no per-group setting exists.
 */
function getGroupRespondMode(botId: string, groupJid: string): GroupRespondMode {
  const row = db.prepare(
    `SELECT respond_mode FROM chatbot_group_settings WHERE chatbot_id = ? AND group_jid = ?`
  ).get(botId, groupJid) as { respond_mode: string } | undefined;
  return (row?.respond_mode as GroupRespondMode) ?? 'allow_all';
}

/**
 * findBotsForMessage — returns all bots (ordered by priority) that should
 * evaluate this incoming message. Used by the webhook/NATS pipeline.
 *
 * Routing rules:
 * - Per-contact override: if a contact has 'manual' mode → skip bot entirely;
 *   if 'disabled' → skip bot; if 'ai' → allow bot to evaluate.
 * - For group messages: apply per-group respond mode before evaluating triggers.
 *   - 'disabled'   → return empty (bot never responds in this group)
 *   - 'mention_only' → only evaluate if message mentions @bot or @assistant
 *   - 'admin_only'  → placeholder (requires bot to track admin list — future)
 *   - 'keyword_trigger' → evaluate normally (keyword/regex triggers handle it)
 *   - 'allow_all'  → evaluate normally
 */
export function findBotsForMessage(
  workspaceId: string,
  instanceId: string,
  message: string,
  contactId?: string,
  conversationId?: string,
  groupJid?: string
): string[] {
  // 1. Get bots enabled for this instance/workspace
  const bots = db.prepare(`
    SELECT id, priority FROM chatbot_configs
    WHERE workspace_id = ? AND instance_id = ? AND enabled = 1
    ORDER BY priority DESC
  `).all(workspaceId, instanceId) as { id: string; priority: number }[];

  const lowerMessage = message.toLowerCase();

  for (const bot of bots) {
    // ── Per-contact routing ──────────────────────────────────────────────────
    if (contactId) {
      const mode = getContactRoutingMode(contactId, bot.id);
      if (mode === 'manual' || mode === 'disabled') {
        continue; // skip this bot — human-only or disabled for this contact
      }
      // mode === 'ai' or null → allow bot to evaluate normally
    }

    // ── Group routing ───────────────────────────────────────────────────────
    if (groupJid) {
      const respondMode = getGroupRespondMode(bot.id, groupJid);

      if (respondMode === 'disabled') {
        continue; // bot is disabled for this group
      }

      if (respondMode === 'mention_only') {
        const mentioned = lowerMessage.includes('@bot') || lowerMessage.includes('@assistant');
        if (!mentioned) {
          continue; // skip — not mentioned
        }
      }

      // 'admin_only': requires admin list from group metadata; placeholder for now
      // 'keyword_trigger' and 'allow_all': evaluate normally below
    }
  }

  return bots.filter(bot => {
    // Re-check exclusions (above loop used `continue` on the outer bots array copy)
    // We re-evaluate here for clarity since we can't continue inside forEach
    if (contactId) {
      const mode = getContactRoutingMode(contactId, bot.id);
      if (mode === 'manual' || mode === 'disabled') return false;
    }
    if (groupJid) {
      const respondMode = getGroupRespondMode(bot.id, groupJid);
      if (respondMode === 'disabled') return false;
      if (respondMode === 'mention_only') {
        const mentioned = lowerMessage.includes('@bot') || lowerMessage.includes('@assistant');
        if (!mentioned) return false;
      }
    }
    return true;
  }).map(b => b.id);
}

/**
 * pickBestBot — when multiple bots match, highest priority wins.
 * Returns botId or null.
 */
export function pickBestBot(
  workspaceId: string,
  instanceId: string,
  message: string,
  contactId?: string,
  conversationId?: string,
  groupJid?: string
): string | null {
  const botIds = findBotsForMessage(workspaceId, instanceId, message, contactId, conversationId, groupJid);
  if (botIds.length === 0) return null;

  // Evaluate each bot's triggers; return first one that triggers
  for (const botId of botIds) {
    const result = evaluateTriggers(botId, message, { workspaceId, contactId, conversationId });
    if (result.shouldRespond) return botId;
  }

  return null;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function safeJsonParse(str: string): unknown {
  try { return JSON.parse(str); } catch { return null; }
}