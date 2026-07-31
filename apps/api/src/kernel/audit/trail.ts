import { v4 as uuidv4 } from 'uuid';
import { bus } from '../events/bus.js';
import db from '../../database.js';
import type { DomainEventType } from '../events/catalog.js';

// =============================================================================
// Audit trail bus subscriber.
// Captures state-changing events and writes audit_logs rows.
// =============================================================================

const STATE_CHANGE_EVENTS: DomainEventType[] = [
  'conversation.assigned',
  'conversation.status_changed',
  'conversation.priority_changed',
  'customer.tagged',
  'customer.noted',
  'integration.connected',
  'integration.synced',
  'campaign.started',
  'campaign.completed',
];

function entityTypeOf(t: DomainEventType): string {
  if (t.startsWith('conversation.')) return 'conversation';
  if (t.startsWith('customer.')) return 'customer';
  if (t.startsWith('integration.')) return 'integration';
  if (t.startsWith('campaign.')) return 'campaign';
  return t;
}

function entityIdFromEnvelope(env: Record<string, unknown>): string {
  return String(
    env.conversationId ?? env.customerId ?? env.integrationId ?? env.campaignId ?? '',
  );
}

export function registerAuditTrail(): void {
  bus().subscribe('*', (envelope: unknown) => {
    const env = envelope as Record<string, unknown> & { __type?: string; __workspaceId?: string | null; __actorUserId?: string | null };
    if (!env || !env.__type) return;
    const type = env.__type as DomainEventType;
    if (!STATE_CHANGE_EVENTS.includes(type)) return;
    const workspaceId = env.__workspaceId;
    if (!workspaceId) return;

    const entityType = entityTypeOf(type);
    const entityId = entityIdFromEnvelope(env);
    if (!entityId) return;

    const { __type: _t, __id: _i, __workspaceId: _w, __actorUserId: _a, workspaceId: _ws, actorUserId: _au, ...payload } = env;

    try {
      db.prepare(`
        INSERT INTO audit_logs
          (id, workspace_id, actor_user_id, action, entity_type, entity_id, before_json, after_json, ip_address, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
      `).run(
        uuidv4(),
        workspaceId,
        env.__actorUserId ?? null,
        `${entityType}.${type.split('.')[1] ?? 'changed'}`,
        entityType,
        entityId,
        null,
        JSON.stringify(payload),
        new Date().toISOString(),
      );
    } catch (e) {
      console.error('[audit-trail] insert failed', e);
    }
  });
}
