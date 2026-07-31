import { v4 as uuidv4 } from 'uuid';
import type { DomainEventType, DomainEventPayload } from './catalog.js';
import db from '../../database.js';

// =============================================================================
// Persist every domain event to domain_events (timeline + replay + analytics).
// Called by dispatchImpl.ts at emit time — no wildcard subscriber needed.
// =============================================================================

interface EntityInfo {
  entityType: string;
  entityId: string;
  customerId: string | null;
  conversationId: string | null;
}

function entityInfoFromPayload(
  type: DomainEventType,
  payload: DomainEventPayload,
): EntityInfo {
  const p = payload as unknown as Record<string, unknown>;

  switch (type) {
    case 'message.received':
    case 'message.sent':
    case 'message.delivered':
    case 'message.read':
    case 'message.failed':
      return {
        entityType: 'message',
        entityId: String(p.messageId ?? ''),
        customerId: String(p.customerId ?? null),
        conversationId: String(p.conversationId ?? null),
      };
    case 'conversation.created':
    case 'conversation.assigned':
    case 'conversation.priority_changed':
    case 'conversation.status_changed':
      return {
        entityType: 'conversation',
        entityId: String(p.conversationId ?? ''),
        customerId: String(p.customerId ?? null),
        conversationId: String(p.conversationId ?? null),
      };
    case 'sla.response_due':
    case 'sla.breached':
      return {
        entityType: 'conversation',
        entityId: String(p.conversationId ?? ''),
        customerId: null,
        conversationId: String(p.conversationId ?? null),
      };
    case 'customer.created':
    case 'customer.tagged':
    case 'customer.noted':
      return {
        entityType: 'customer',
        entityId: String(p.customerId ?? ''),
        customerId: String(p.customerId ?? null),
        conversationId: null,
      };
    case 'campaign.started':
    case 'campaign.completed':
      return {
        entityType: 'campaign',
        entityId: String(p.campaignId ?? ''),
        customerId: null,
        conversationId: null,
      };
    case 'automation.triggered':
    case 'flow.started':
    case 'flow.step':
    case 'flow.completed':
      return {
        entityType: 'automation_flow',
        entityId: String(p.flowId ?? (p.executionId ?? '')),
        customerId: String(p.customerId ?? null),
        conversationId: String(p.conversationId ?? null),
      };
    case 'integration.connected':
    case 'integration.synced':
      return {
        entityType: 'integration',
        entityId: String(p.integrationId ?? ''),
        customerId: null,
        conversationId: null,
      };
    case 'order.created':
    case 'order.fulfilled':
      return {
        entityType: 'order',
        entityId: String(p.orderId ?? ''),
        customerId: String(p.customerId ?? null),
        conversationId: null,
      };
    case 'inventory.updated':
      return {
        entityType: 'product',
        entityId: String(p.productId ?? ''),
        customerId: null,
        conversationId: null,
      };
    case 'knowledge.indexed':
      return {
        entityType: 'knowledge_source',
        entityId: String(p.sourceId ?? ''),
        customerId: null,
        conversationId: null,
      };
    default:
      return { entityType: 'unknown', entityId: '', customerId: null, conversationId: null };
  }
}

export function logDomainEvent(
  workspaceId: string | null,
  type: DomainEventType,
  payload: DomainEventPayload,
  actorUserId: string | null = null,
): void {
  const { entityType, entityId, customerId, conversationId } = entityInfoFromPayload(type, payload);

  db.prepare(`
    INSERT INTO domain_events
      (id, workspace_id, type, entity_type, entity_id, customer_id, conversation_id, actor_user_id, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    workspaceId,
    type,
    entityType,
    entityId,
    customerId,
    conversationId,
    actorUserId,
    JSON.stringify(payload),
    new Date().toISOString(),
  );
}
