/**
 * Conversation state machine — transition functions + queue queries.
 */
import db, { saveDatabase } from '../../../database.js';

export type ConversationState = 'BOT' | 'WAITING_AGENT' | 'AGENT' | 'BOT_PAUSED' | 'BOT_RESUME_PENDING' | 'CLOSED';

export interface HandoffResult {
  success: boolean;
  newState: ConversationState;
  assignedAgentId?: string;
  message?: string;
}

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
 * Auto-pause when human replies — pauses bot if it was active.
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
