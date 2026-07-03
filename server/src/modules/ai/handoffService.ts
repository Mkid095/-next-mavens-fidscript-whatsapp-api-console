/**
 * Human Handoff + Conversation State Manager
 *
 * States:
 *   BOT             — chatbot is actively responding
 *   WAITING_AGENT   — bot has requested a human, none assigned yet
 *   AGENT           — a human agent is actively chatting
 *   BOT_PAUSED      — bot is silent (human replied while bot was active)
 *   BOT_RESUME_PENDING — human ended chat, bot should resume
 *   CLOSED          — conversation resolved/closed, no more responses
 *
 * Transition rules:
 *   Message from human  → BOT_PAUSED (if was BOT) or stays AGENT
 *   Agent takes conv    → AGENT
 *   Agent closes/ends   → BOT_RESUME_PENDING or CLOSED
 *   Auto-resume timer   → BOT (from BOT_RESUME_PENDING)
 *   Explicit close      → CLOSED
 */
import db, { saveDatabase } from '../../database.js';
import { evaluateConditions } from './chatbotEngine.js';
import type { EvaluationContext } from './chatbotEngine.js';

export type ConversationState = 'BOT' | 'WAITING_AGENT' | 'AGENT' | 'BOT_PAUSED' | 'BOT_RESUME_PENDING' | 'CLOSED';

export interface HandoffResult {
  success: boolean;
  newState: ConversationState;
  assignedAgentId?: string;
  message?: string;
}

// ─── State Transitions ─────────────────────────────────────────────────────────

/**
 * Transition conversation to a new state, with audit logging.
 */
export function setConversationState(
  conversationId: string,
  newState: ConversationState,
  reason = ''
): void {
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO conversation_states (conversation_id, state, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(conversation_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`
  ).run(conversationId, newState, now);
  saveDatabase();
}

/**
 * Get current state of a conversation.
 */
export function getConversationState(conversationId: string): ConversationState {
  const row = db.prepare(
    'SELECT state FROM conversation_states WHERE conversation_id = ?'
  ).get(conversationId) as { state: ConversationState } | undefined;
  return row?.state ?? 'BOT';
}

/**
 * Record an agent assignment for a conversation.
 */
export function assignConversation(
  conversationId: string,
  agentId: string,
  agentName: string,
  teamId = ''
): HandoffResult {
  const existing = db.prepare(
    'SELECT id FROM conversation_assignments WHERE conversation_id = ? AND released_at IS NULL'
  ).get(conversationId) as { id: string } | undefined;

  if (existing) {
    return { success: false, newState: getConversationState(conversationId), message: 'Already assigned' };
  }

  const id = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(`INSERT INTO conversation_assignments
    (id, conversation_id, agent_id, agent_name, team_id, assigned_at, reason)
    VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`
  ).run(id, conversationId, agentId, agentName, teamId, 'Human handoff requested');

  // Transition to AGENT state
  setConversationState(conversationId, 'AGENT', 'Agent assigned');

  return { success: true, newState: 'AGENT', assignedAgentId: agentId };
}

/**
 * Release an agent assignment (agent ended the conversation).
 */
export function releaseConversation(
  conversationId: string,
  reason = 'Agent ended conversation'
): void {
  db.prepare(`UPDATE conversation_assignments
    SET released_at = datetime('now'), reason = ?
    WHERE conversation_id = ? AND released_at IS NULL`
  ).run(reason, conversationId);

  // Transition to BOT_RESUME_PENDING (bot should resume when customer messages again)
  setConversationState(conversationId, 'BOT_RESUME_PENDING', reason);
}

/**
 * Close a conversation permanently.
 */
export function closeConversation(conversationId: string, reason = 'Resolved'): void {
  setConversationState(conversationId, 'CLOSED', reason);
  db.prepare(`UPDATE conversation_assignments
    SET released_at = datetime('now')
    WHERE conversation_id = ? AND released_at IS NULL`
  ).run(conversationId);
}

/**
 * Resume bot after human handoff ended.
 */
export function resumeBot(conversationId: string): void {
  setConversationState(conversationId, 'BOT', 'Bot resumed after handoff');
}

/**
 * Trigger a human handoff — transition to WAITING_AGENT and notify configured channels.
 */
export function requestHandoff(
  conversationId: string,
  targetTeamId = '',
  targetTeamName = ''
): HandoffResult {
  const currentState = getConversationState(conversationId);

  if (currentState === 'AGENT') {
    return { success: false, newState: 'AGENT', message: 'Agent already active' };
  }

  if (currentState === 'CLOSED') {
    return { success: false, newState: 'CLOSED', message: 'Conversation is closed' };
  }

  setConversationState(conversationId, 'WAITING_AGENT', 'Handoff requested');

  console.log(`[handoff] Conversation ${conversationId} waiting for agent (team: ${targetTeamName})`);

  // Fire async notifications — don't block the response
  const conv = db.prepare(
    `SELECT workspace_id FROM conversations WHERE id = ?`
  ).get(conversationId) as { workspace_id: string } | undefined;

  if (conv) {
    notifyHandoff({
      workspaceId: conv.workspace_id,
      conversationId,
      targetTeamId,
      targetTeamName,
    }).catch(err => console.error('[handoff] notification failed:', err));
  }

  return { success: true, newState: 'WAITING_AGENT' };
}

interface HandoffNotifyOpts {
  workspaceId: string;
  conversationId: string;
  targetTeamId?: string;
  targetTeamName?: string;
}

/**
 * Send handoff notifications to all configured channels for this workspace.
 * Supports webhook (POST JSON) and email (via internal email route) destinations.
 */
async function notifyHandoff(opts: HandoffNotifyOpts): Promise<void> {
  const { workspaceId, conversationId, targetTeamName } = opts;

  // Load all enabled notification configs for this workspace
  const configs = db.prepare(`
    SELECT * FROM chatbot_handoff_config
    WHERE workspace_id = ? AND enabled = 1
  `).all(workspaceId) as Array<{
    id: string;
    notification_type: string;
    target_url: string;
  }>;

  if (configs.length === 0) {
    console.log(`[handoff] No notification channels configured for workspace ${workspaceId}`);
    return;
  }

  const payload = {
    event: 'handoff.requested',
    conversationId,
    workspaceId,
    targetTeamName: targetTeamName ?? null,
    timestamp: new Date().toISOString(),
    message: `A customer is waiting and needs human assistance${targetTeamName ? ` (team: ${targetTeamName})` : ''}.`,
    viewConversationUrl: `https://whatsapp.fidscript.com/client/inbox?conversation=${conversationId}`,
  };

  for (const config of configs) {
    try {
      if (config.notification_type === 'webhook') {
        await fetch(config.target_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        console.log(`[handoff] Notified webhook: ${config.target_url}`);
      } else if (config.notification_type === 'email') {
        // Send via internal email route (same Resend integration as the rest of the platform)
        await fetch(`${process.env.API_INTERNAL_URL || 'http://localhost:3099'}/api/platform/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: config.target_url,
            subject: `Customer waiting — ${targetTeamName ?? 'New handoff request'}`,
            text: payload.message,
            html: `<p>${payload.message}</p><p><a href="${payload.viewConversationUrl}">View conversation</a></p>`,
          }),
        });
        console.log(`[handoff] Notified email: ${config.target_url}`);
      }
    } catch (err) {
      console.error(`[handoff] Failed to notify (${config.notification_type}):`, err);
    }
  }
}

// ─── Handoff Rules Engine ─────────────────────────────────────────────────────

/**
 * Evaluate handoff rules for a chatbot and message.
 * Returns the first matching rule's target, or null.
 */
export function evaluateHandoffRules(
  chatbotId: string,
  ctx: { contactId?: string; conversationId?: string; workspaceId: string; message?: string }
): { shouldHandoff: boolean; targetTeamId?: string; targetTeamName?: string } {
  const rules = db.prepare(`
    SELECT * FROM chatbot_handoff_rules
    WHERE chatbot_id = ? AND enabled = 1
    ORDER BY priority DESC
  `).all(chatbotId) as Array<{
    id: string;
    name: string;
    conditions_json: string;
    target_team_id: string;
    target_team_name: string;
  }>;

  // Build the evaluation context using the same shape as chatbotEngine expects
  const evalCtx: EvaluationContext = {
    workspaceId: ctx.workspaceId,
    contactId: ctx.contactId,
    conversationId: ctx.conversationId,
  };

  for (const rule of rules) {
    // evaluateConditions returns true if all conditions pass (or no conditions exist)
    const matched = evaluateConditions(rule.conditions_json, evalCtx);
    if (matched) {
      return { shouldHandoff: true, targetTeamId: rule.target_team_id, targetTeamName: rule.target_team_name };
    }
  }

  return { shouldHandoff: false };
}

// ─── Auto-pause when human replies ───────────────────────────────────────────

/**
 * Called when an outgoing message comes from a human agent (not the bot).
 * Pauses the bot so it doesn't spam while a human is chatting.
 */
export function onHumanReply(conversationId: string): void {
  const current = getConversationState(conversationId);
  if (current === 'BOT') {
    setConversationState(conversationId, 'BOT_PAUSED', 'Human replied while bot was active');
  } else if (current === 'WAITING_AGENT') {
    setConversationState(conversationId, 'AGENT', 'Human replied');
  }
}

/**
 * Get all conversations currently waiting for an agent.
 */
export function getWaitingConversations(teamId?: string): Array<{
  conversation_id: string;
  state: ConversationState;
  updated_at: string;
}> {
  if (teamId) {
    return db.prepare(`
      SELECT cs.conversation_id, cs.state, cs.updated_at
      FROM conversation_states cs
      JOIN conversation_assignments ca ON ca.conversation_id = cs.conversation_id
      WHERE cs.state = 'WAITING_AGENT' AND ca.team_id = ? AND ca.released_at IS NULL
      ORDER BY cs.updated_at ASC
    `).all(teamId) as Array<{ conversation_id: string; state: ConversationState; updated_at: string }>;
  }
  return db.prepare(`
    SELECT conversation_id, state, updated_at
    FROM conversation_states
    WHERE state = 'WAITING_AGENT'
    ORDER BY updated_at ASC
  `).all() as Array<{ conversation_id: string; state: ConversationState; updated_at: string }>;
}
