import { bus } from '../events/bus.js';
import { sqliteFtsProvider } from './provider.js';
import type { DomainEventPayload } from '../events/catalog.js';

// =============================================================================
// Search indexer — bus subscriber.
// Subscribes to specific event types and upserts/deletes index rows per event.
// Registered at server boot via registerSearchIndexer().
// =============================================================================

function tagify(tags: string[]): string[] {
  return tags;
}

function r(payload: DomainEventPayload): Record<string, unknown> {
  return payload as unknown as Record<string, unknown>;
}

async function indexMessage(wsId: string, entityId: string, content: string, messageType: string): Promise<void> {
  if (!content && messageType === 'text') return;
  await sqliteFtsProvider.index(wsId, 'message', entityId, `[${messageType}] ${content}`, [messageType]);
}

async function indexCustomer(wsId: string, entityId: string, displayName: string | null, tags: string[]): Promise<void> {
  await sqliteFtsProvider.index(wsId, 'customer', entityId, displayName || 'Unnamed customer', tagify(tags));
}

async function indexCampaign(wsId: string, entityId: string, name: string, content?: string | null): Promise<void> {
  await sqliteFtsProvider.index(wsId, 'campaign', entityId, `${name} ${content ?? ''}`, ['campaign']);
}

async function indexOrder(wsId: string, entityId: string, orderId: string, total: number): Promise<void> {
  await sqliteFtsProvider.index(wsId, 'order', entityId, `Order ${orderId} — KES ${total.toLocaleString()}`, ['order', 'commerce']);
}

async function indexKnowledge(wsId: string, entityId: string, name: string, ref?: string | null): Promise<void> {
  await sqliteFtsProvider.index(wsId, 'knowledge', entityId, `${name} ${ref ?? ''}`, ['knowledge']);
}

// ---------------------------------------------------------------------------
// Per-event-type handlers
// ---------------------------------------------------------------------------

async function handleMessageReceived(wsId: string, payload: DomainEventPayload): Promise<void> {
  const p = r(payload);
  await indexMessage(wsId, String(p.messageId ?? ''), String(p.content ?? ''), String(p.messageType ?? 'text'));
}

async function handleMessageSent(wsId: string, payload: DomainEventPayload): Promise<void> {
  const p = r(payload);
  await indexMessage(wsId, String(p.messageId ?? ''), String(p.content ?? ''), String(p.messageType ?? 'text'));
}

async function handleCustomerCreated(wsId: string, payload: DomainEventPayload): Promise<void> {
  const p = r(payload);
  await indexCustomer(wsId, String(p.customerId ?? ''), p.displayName as string | null, ['customer']);
}

async function handleCustomerTagged(wsId: string, payload: DomainEventPayload): Promise<void> {
  const p = r(payload);
  await indexCustomer(wsId, String(p.customerId ?? ''), null, ['customer', String(p.tag ?? '')]);
}

async function handleCampaignStarted(wsId: string, payload: DomainEventPayload): Promise<void> {
  const p = r(payload);
  await indexCampaign(wsId, String(p.campaignId ?? ''), 'Campaign started', null);
}

async function handleOrderCreated(wsId: string, payload: DomainEventPayload): Promise<void> {
  const p = r(payload);
  await indexOrder(wsId, String(p.orderId ?? ''), String(p.orderId ?? ''), Number(p.total ?? 0));
}

async function handleKnowledgeIndexed(wsId: string, payload: DomainEventPayload): Promise<void> {
  const p = r(payload);
  await indexKnowledge(wsId, String(p.sourceId ?? ''), 'Knowledge updated', null);
}

// ---------------------------------------------------------------------------
// Register all handlers against the bus
// ---------------------------------------------------------------------------

export function registerSearchIndexer(): void {
  const HANDLERS: Array<{ type: string; handler: (wsId: string, p: DomainEventPayload) => Promise<void> }> = [
    { type: 'message.received', handler: handleMessageReceived },
    { type: 'message.sent', handler: handleMessageSent },
    { type: 'customer.created', handler: handleCustomerCreated },
    { type: 'customer.tagged', handler: handleCustomerTagged },
    { type: 'campaign.started', handler: handleCampaignStarted },
    { type: 'order.created', handler: handleOrderCreated },
    { type: 'knowledge.indexed', handler: handleKnowledgeIndexed },
  ];

  HANDLERS.forEach(({ type, handler }) => {
    bus().subscribe(type as never, async (payload: DomainEventPayload) => {
      const p = r(payload);
      const wsId = String(p.workspaceId ?? p.customerId ?? '');
      if (!wsId) return;
      try {
        await handler(wsId, payload);
      } catch (err) {
        console.error(`[search.indexer] ${type} failed:`, err);
      }
    });
  });
}
