import { bus } from '../platform/events/bus.js';
import db from '../../database.js';
import type { WorkspaceContext } from '../platform/workspace/index.js';
import type { DomainEventPayload, MessageReceivedPayload } from '../platform/events/catalog.js';

// =============================================================================
// runInboundPipeline — subscribes to message.received on the bus.
// Run at server boot (registered in server/src/index.ts).
//
// Pipeline per spec §10.1:
//   1. Load workspace automation + agent config
//   2. Check conversation.ai_state → skip if not ai_active
//   3. Pick agent by trigger/route
//   4. Agent reasons (knowledge + tools), emits reply
//   5. If confidence < threshold OR escalation trigger → request handoff
//   6. Reply sent via channel service (same path as human send)
//
// Phase 2 ships the skeleton + keyword rule engine only (no real LLM yet).
// =============================================================================

interface KeywordRule {
  id: string;
  workspaceId: string;
  keyword: string;
  reply: string;
  confidenceThreshold: number;
  escalateOnLowConfidence: boolean;
  setAiState?: string;
  enabled: boolean;
}

function getKeywordRules(workspaceId: string): KeywordRule[] {
  const rows = db.prepare(`
    SELECT id, workspace_id, keyword, reply, confidence_threshold, escalate_on_low_confidence, set_ai_state, enabled
    FROM ai_keyword_rules
    WHERE workspace_id = ? AND enabled = 1
  `).all(workspaceId) as Record<string, unknown>[];
  return rows.map(r => ({
    id: String(r.id),
    workspaceId: String(r.workspace_id),
    keyword: String(r.keyword),
    reply: String(r.reply),
    confidenceThreshold: Number(r.confidence_threshold ?? 0.7),
    escalateOnLowConfidence: Boolean(r.escalate_on_low_confidence ?? true),
    setAiState: r.set_ai_state ? String(r.set_ai_state) : undefined,
    enabled: Boolean(r.enabled ?? true),
  }));
}

function updateConversationAiState(conversationId: string, newState: string): void {
  db.prepare('UPDATE conversations SET ai_state = ? WHERE id = ?').run(newState, conversationId);
}

interface RuleMatch { rule: KeywordRule; confidence: number; }

function matchKeywordRules(rules: KeywordRule[], message: string): RuleMatch | null {
  const lower = message.toLowerCase();
  for (const rule of rules) {
    if (lower.includes(rule.keyword.toLowerCase())) {
      return { rule, confidence: 0.95 };
    }
  }
  return null;
}

const ESCALATION_TRIGGERS = ['agent', 'human', 'real person', 'talk to someone', 'representative'];

function shouldEscalate(message: string, confidence: number, threshold: number): boolean {
  const lower = message.toLowerCase();
  if (confidence < threshold) return true;
  return ESCALATION_TRIGGERS.some(t => lower.includes(t));
}

async function executeKeywordRule(
  ctx: WorkspaceContext,
  match: RuleMatch,
  conversationId: string,
  customerId: string,
  message: string
): Promise<void> {
  const { rule, confidence } = match;

  bus().emit('ai.reply.generated', {
    agentId: rule.id,
    conversationId,
    messageId: `ai_${Date.now()}`,
    confidence,
  } as DomainEventPayload).catch(() => {});

  console.log(`[ai.inbound] keyword rule "${rule.keyword}" matched — would reply: "${rule.reply}"`);

  if (shouldEscalate(message, confidence, rule.confidenceThreshold)) {
    const newState = rule.setAiState ?? 'escalated';
    updateConversationAiState(conversationId, newState);
    bus().emit('ai.handoff_requested', {
      agentId: rule.id,
      conversationId,
      reason: `Keyword "${rule.keyword}" triggered escalation`,
      confidence,
    } as DomainEventPayload).catch(() => {});
    bus().emit('ai.state_changed', {
      conversationId,
      state: newState as 'ai_active' | 'ai_paused' | 'human_active' | 'escalated',
      byUserId: ctx.userId,
    } as DomainEventPayload).catch(() => {});
  }
}

export async function runInboundPipeline(
  payload: MessageReceivedPayload,
  ctx: WorkspaceContext
): Promise<void> {
  const { conversationId, customerId, content, messageType } = payload;

  if (messageType !== 'text') return;

  const conv = db.prepare(
    'SELECT ai_state FROM conversations WHERE id = ? AND workspace_id = ?'
  ).get(conversationId, ctx.workspaceId) as { ai_state: string } | undefined;

  if (!conv || conv.ai_state !== 'ai_active') return;

  const rules = getKeywordRules(ctx.workspaceId);
  const match = matchKeywordRules(rules, content);
  if (!match) return;

  await executeKeywordRule(ctx, match, conversationId, customerId, content);
}

export function registerInboundPipeline(): void {
  bus().subscribe('message.received', async (raw: DomainEventPayload) => {
    const p = raw as unknown as Record<string, unknown>;
    const wsId = String(p.workspaceId ?? '');
    if (!wsId) return;
    const ctx: WorkspaceContext = {
      workspaceId: wsId,
      userId: wsId,
      roleId: 'role_0',
      perms: ['*'],
    };
    try {
      await runInboundPipeline(raw as MessageReceivedPayload, ctx);
    } catch (err) {
      console.error('[ai.inbound] pipeline error:', err);
    }
  });
}
