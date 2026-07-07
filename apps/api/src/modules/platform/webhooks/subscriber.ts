import { bus } from '../events/index.js';
import db from '../../../database.js';
import { signPayload } from './hmac.js';
import type { DomainEventType, DomainEventPayload } from '../events/index.js';

// =============================================================================
// Webhook fan-out — bus().subscribe('*', deliverToWebhooks).
// §14.1: every domain event is delivered to matching webhooks with HMAC
// signing, exponential backoff (5 attempts: 0s, 5s, 30s, 2m, 10m), and a
// delivery row recorded in webhook_deliveries for the activity log.
// =============================================================================

const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [0, 5_000, 30_000, 120_000, 600_000];

interface WebhookRow {
  id: string;
  workspace_id: string;
  url: string;
  events: string;       // JSON array of event names, or "*" for all
  secret: string;
  status: string;
}

function matchesFilter(filter: string, eventType: string): boolean {
  if (filter === '*' || filter === '["*"]') return true;
  try {
    const arr = JSON.parse(filter) as string[];
    return arr.includes(eventType) || arr.includes('*');
  } catch {
    return false;
  }
}

async function postWithTimeout(url: string, body: string, headers: Record<string, string>, timeoutMs: number): Promise<{ status: number; text: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'POST', body, headers, signal: ctrl.signal });
    const text = await res.text().catch(() => '');
    return { status: res.status, text: text.slice(0, 2000) };
  } finally {
    clearTimeout(t);
  }
}

interface DeliveryRow {
  id: string;
  attempt: number;
  success: boolean;
  status: number;
  error: string | null;
}

async function deliverOnce(wh: WebhookRow, eventType: string, eventId: string, body: string, attempt: number): Promise<DeliveryRow> {
  const signature = signPayload(wh.secret, body);
  const headers = {
    'Content-Type': 'application/json',
    'X-FIDScript-Signature': signature,
    'X-FIDScript-Event': eventType,
    'X-FIDScript-Delivery': eventId,
  };
  let status = 0;
  let responseText = '';
  let error: string | null = null;
  try {
    const res = await postWithTimeout(wh.url, body, headers, 10_000);
    status = res.status;
    responseText = res.text;
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
  }
  const success = status >= 200 && status < 300;
  const id = `${eventId}_a${attempt}`;
  db.prepare(`
    INSERT INTO webhook_deliveries
      (id, webhook_id, event_id, event_type, payload_json, response_code, response_body, attempt, delivered_at, error, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    wh.id,
    eventId,
    eventType,
    body,
    status,
    responseText || null,
    attempt,
    success ? new Date().toISOString() : null,
    error,
    new Date().toISOString()
  );
  return { id, attempt, success, status, error };
}

async function deliverOne(wh: WebhookRow, eventType: string, eventId: string, payload: DomainEventPayload): Promise<void> {
  const body = JSON.stringify({
    id: eventId,
    type: eventType,
    workspace_id: wh.workspace_id,
    created_at: new Date().toISOString(),
    data: payload,
  });
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt - 1] > 0) {
      await new Promise(r => setTimeout(r, BACKOFF_MS[attempt - 1]));
    }
    const row = await deliverOnce(wh, eventType, eventId, body, attempt);
    if (row.success) {
      db.prepare('UPDATE webhooks SET last_delivery_at = ? WHERE id = ?')
        .run(new Date().toISOString(), wh.id);
      return;
    }
  }
}

export function registerWebhookFanout(): void {
  bus().subscribe('*', (envelope: unknown) => {
    const env = envelope as { __type?: string; __id?: string; __workspaceId?: string | null; __actorUserId?: string | null };
    if (!env || !env.__type) return;
    const eventType = env.__type as DomainEventType;
    const eventId = env.__id ?? '';
    const workspaceId = env.__workspaceId ?? null;
    if (!workspaceId) return; // can't scope to a webhook without workspace

    const whs = db.prepare(`SELECT * FROM webhooks WHERE workspace_id = ? AND status = 'active'`)
      .all(workspaceId) as unknown as WebhookRow[];
    if (whs.length === 0) return;

    for (const wh of whs) {
      if (!matchesFilter(wh.events, eventType)) continue;
      // strip envelope fields before serializing payload
      const { __type, __id, __workspaceId, __actorUserId, ...payload } = envelope as Record<string, unknown>;
      void deliverOne(wh, eventType, eventId, payload as unknown as DomainEventPayload);
    }
  });
}
