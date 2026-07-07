/**
 * Handoff request + notification dispatch.
 */
import db from '../../../database.js';
import type { ConversationState } from './state.js';
import { getConversationState, setConversationState } from './state.js';

interface HandoffNotifyOpts {
  workspaceId: string;
  conversationId: string;
  targetTeamId?: string;
  targetTeamName?: string;
}

/**
 * Trigger a human handoff — transition to WAITING_AGENT and notify configured channels.
 */
export function requestHandoff(
  conversationId: string,
  targetTeamId = '',
  targetTeamName = ''
): { success: boolean; newState: ConversationState; message?: string } {
  const currentState = getConversationState(conversationId);

  if (currentState === 'AGENT') {
    return { success: false, newState: 'AGENT', message: 'Agent already active' };
  }

  if (currentState === 'CLOSED') {
    return { success: false, newState: 'CLOSED', message: 'Conversation is closed' };
  }

  setConversationState(conversationId, 'WAITING_AGENT', 'Handoff requested');
  console.log(`[handoff] Conversation ${conversationId} waiting for agent (team: ${targetTeamName})`);

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

/**
 * Send handoff notifications to all configured channels for this workspace.
 * Supports webhook (POST JSON) and email destinations.
 */
export async function notifyHandoff(opts: HandoffNotifyOpts): Promise<void> {
  const { workspaceId, conversationId, targetTeamName } = opts;

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
