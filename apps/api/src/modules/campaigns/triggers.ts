import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { bus } from '../platform/events/bus.js';
import type {
  CustomerCreatedPayload,
  CustomerTaggedPayload,
  ConversationCreatedPayload,
  OrderCreatedPayload,
  DomainEventPayload,
} from '../platform/events/catalog.js';
import { enrollCustomer } from './drip.js';

// =============================================================================
// Campaign trigger subscriber (§15.5 — Event-triggered campaigns).
// For every trigger-eligible event, find campaigns with type='drip' (and a
// matching campaign_triggers row) in the same workspace, apply the trigger's
// filter_json, and enroll matching customers into the campaign.
//
// Trigger events supported: customer.created, customer.tagged,
//   conversation.created, order.created.
// =============================================================================

const TRIGGER_EVENTS = ['customer.created', 'customer.tagged', 'conversation.created', 'order.created'] as const;
type TriggerEvent = typeof TRIGGER_EVENTS[number];

function isTriggerEvent(t: string): t is TriggerEvent {
  return (TRIGGER_EVENTS as readonly string[]).includes(t);
}

function workspaceIdFromEvent(raw: DomainEventPayload): string | null {
  const p = raw as unknown as Record<string, unknown>;
  return p.workspaceId ? String(p.workspaceId) : null;
}

function matchesFilter(filterJson: string, eventKey: string, eventVal: unknown): boolean {
  if (!filterJson) return true; // empty filter = matches all
  let f: Record<string, unknown> = {};
  try { f = JSON.parse(filterJson) as Record<string, unknown>; } catch { return true; }
  // Minimal matcher: filter is a flat object { tag: 'vip' } — every key must
  // match the event payload via the supplied getter.
  for (const [k, v] of Object.entries(f)) {
    if (k === eventKey) {
      if (Array.isArray(v)) { if (!(v as unknown[]).includes(eventVal)) return false; }
      else { if (v !== eventVal) return false; }
    }
  }
  return true;
}

function getCustomerIdFromEvent(eventType: TriggerEvent, raw: DomainEventPayload): string | null {
  const p = raw as unknown as Record<string, unknown>;
  if (eventType === 'customer.created') return String((p as unknown as CustomerCreatedPayload).customerId);
  if (eventType === 'customer.tagged') return String((p as unknown as CustomerTaggedPayload).customerId);
  if (eventType === 'conversation.created') return String((p as unknown as ConversationCreatedPayload).customerId);
  if (eventType === 'order.created') return String((p as unknown as OrderCreatedPayload).customerId);
  return null;
}

function getFilterKeyVal(eventType: TriggerEvent, raw: DomainEventPayload): { key: string; val: unknown } {
  const p = raw as unknown as Record<string, unknown>;
  if (eventType === 'customer.tagged') return { key: 'tag', val: (p as unknown as CustomerTaggedPayload).tag };
  if (eventType === 'order.created') return { key: 'min_total', val: (p as unknown as OrderCreatedPayload).total };
  return { key: '', val: null };
}

export function registerTriggers(): void {
  for (const ev of TRIGGER_EVENTS) {
    bus().subscribe(ev, async (raw: DomainEventPayload) => {
      try { await handle(ev, raw); } catch (err) { console.error(`[triggers] ${ev} handler failed:`, err); }
    });
  }
  console.log(`✅ Trigger subscribers registered for ${TRIGGER_EVENTS.join(', ')}`);
}

async function handle(eventType: TriggerEvent, raw: DomainEventPayload): Promise<void> {
  const workspaceId = workspaceIdFromEvent(raw);
  if (!workspaceId) return;
  const customerId = getCustomerIdFromEvent(eventType, raw);
  if (!customerId) return;

  // Find all drip campaigns in this workspace that have a trigger for this event
  const triggers = db.prepare(`
    SELECT ct.id AS trigger_id, ct.campaign_id, ct.filter_json
    FROM campaign_triggers ct
    JOIN campaigns c ON c.id = ct.campaign_id
    WHERE c.workspace_id = ? AND c.type = 'drip' AND ct.event = ? AND ct.enabled = 1
  `).all(workspaceId, eventType) as { trigger_id: string; campaign_id: string; filter_json: string }[];

  if (triggers.length === 0) return;

  const { key, val } = getFilterKeyVal(eventType, raw);
  for (const t of triggers) {
    if (!matchesFilter(t.filter_json, key, val)) continue;
    enrollCustomer(customerId, t.campaign_id);
    console.log(`[triggers] enrolled customer ${customerId} into campaign ${t.campaign_id} via ${eventType}`);
  }
}

// ---------------------------------------------------------------------------
// Helpers used by the routes layer
// ---------------------------------------------------------------------------

export function listTriggersForCampaign(campaignId: string, workspaceId: string) {
  return db.prepare(`
    SELECT * FROM campaign_triggers WHERE campaign_id = ? AND campaign_id IN
      (SELECT id FROM campaigns WHERE workspace_id = ?)
    ORDER BY created_at ASC
  `).all(campaignId, workspaceId);
}

export function createTrigger(campaignId: string, event: string, filterJson: string): string {
  const id = `trig_${uuidv4().substring(0, 8)}`;
  db.prepare(`INSERT INTO campaign_triggers (id, campaign_id, event, filter_json, enabled) VALUES (?, ?, ?, ?, 1)`)
    .run(id, campaignId, event, filterJson);
  return id;
}

export function deleteTrigger(id: string, workspaceId: string): boolean {
  // Verify ownership via the campaign's workspace
  const row = db.prepare(`
    SELECT ct.id FROM campaign_triggers ct
    JOIN campaigns c ON c.id = ct.campaign_id
    WHERE ct.id = ? AND c.workspace_id = ?
  `).get(id, workspaceId);
  if (!row) return false;
  db.prepare('DELETE FROM campaign_triggers WHERE id = ?').run(id);
  return true;
}
