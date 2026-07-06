/**
 * botRouter.ts — bot lookup, routing mode resolution, and best-bot selection.
 *
 * Handles which bots evaluate an inbound message and which one wins
 * when multiple bots are eligible.
 */

import db from '../../database.js';
import { evaluateTriggers } from './chatbotEngine.js';

export type GroupRespondMode = 'mention_only' | 'keyword_trigger' | 'admin_only' | 'disabled' | 'allow_all';

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

/**
 * Resolves per-group respond mode for a bot.
 * Returns 'allow_all' if no per-group setting exists.
 */
function getGroupRespondMode(botId: string, groupJid: string): GroupRespondMode {
  const row = db.prepare(
    `SELECT respond_mode FROM chatbot_group_settings WHERE chatbot_id = ? AND group_jid = ?`
  ).get(botId, groupJid) as { respond_mode: string } | undefined;
  return (row?.respond_mode as GroupRespondMode) ?? 'allow_all';
}

/**
 * findBotsForMessage — returns all bot IDs (ordered by priority) eligible
 * to evaluate this incoming message.
 *
 * Routing rules:
 * - Per-contact override: 'manual'/'disabled' → skip; 'ai' or null → evaluate
 * - For groups: apply per-group respond mode
 *   - 'disabled'        → skip entirely
 *   - 'mention_only'    → only if @bot or @assistant is mentioned
 *   - 'keyword_trigger' / 'allow_all' → evaluate normally
 */
export function findBotsForMessage(
  workspaceId: string,
  instanceId: string,
  message: string,
  contactId?: string,
  _conversationId?: string,
  groupJid?: string
): string[] {
  const bots = db.prepare(`
    SELECT id, priority FROM chatbot_configs
    WHERE workspace_id = ? AND instance_id = ? AND enabled = 1
    ORDER BY priority DESC
  `).all(workspaceId, instanceId) as { id: string; priority: number }[];

  const lowerMessage = message.toLowerCase();

  return bots.filter(bot => {
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

  for (const botId of botIds) {
    const result = evaluateTriggers(botId, message, { workspaceId, contactId, conversationId });
    if (result.shouldRespond) return botId;
  }

  return null;
}
