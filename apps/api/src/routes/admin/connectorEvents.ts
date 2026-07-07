/**
 * connectorEvents.ts — GET + POST /admin/system/connector-events
 *
 * Lists connector events (with filtering by status/workspace/connector).
 * POST /retry/:id re-dispatches a failed event immediately.
 */
import { Router, type Request, type Response } from 'express';
import { adminAuth } from '../../middleware/auth.js';
import db from '../../database.js';

const router = Router();
router.use(adminAuth);

// ─── List ────────────────────────────────────────────────────────────────────

router.get('/', (req: Request, res: Response) => {
  const {
    status,
    workspace_id,
    connector_slug,
    limit = '50',
    offset = '0',
  } = req.query as Record<string, string>;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    conditions.push(`status = ?`);
    params.push(status);
  }
  if (workspace_id) {
    conditions.push(`workspace_id = ?`);
    params.push(workspace_id);
  }
  if (connector_slug) {
    conditions.push(`connector_slug = ?`);
    params.push(connector_slug);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitVal = Math.min(Number(limit), 200);
  const offsetVal = Number(offset);

  const rows = db.prepare(`
    SELECT
      id,
      workspace_id,
      connector_slug,
      event_type,
      status,
      retry_count,
      last_error,
      next_retry_at,
      processed_at,
      created_at
    FROM connector_events
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limitVal, offsetVal);

  const countRow = db.prepare(`
    SELECT COUNT(*) AS total FROM connector_events ${where}
  `).get(...params) as { total: number };

  res.json({
    success: true,
    data: {
      events: rows,
      total: countRow.total,
      limit: limitVal,
      offset: offsetVal,
    },
  });
});

// ─── Retry ───────────────────────────────────────────────────────────────────

router.post('/retry/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const row = db.prepare(`
    SELECT id, workspace_id, connector_slug, event_type, raw_payload, status, retry_count
    FROM connector_events WHERE id = ?
  `).get(id) as {
    id: string;
    workspace_id: string;
    connector_slug: string;
    event_type: string;
    raw_payload: string;
    status: string;
    retry_count: number;
  } | undefined;

  if (!row) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  if (row.status === 'processing' || row.status === 'completed') {
    return res.status(409).json({
      success: false,
      error: `Cannot retry event with status '${row.status}'`,
    });
  }

  const rawPayload = JSON.parse(row.raw_payload) as Record<string, unknown>;

  // Reset to pending before dispatching
  db.prepare(`
    UPDATE connector_events
       SET status = 'pending', next_retry_at = NULL
     WHERE id = ?
  `).run(id);

  try {
    // Lazy-import to avoid circular — dispatchConnectorEvent is not exported yet
    // We call through the webhook handler path by importing handleShopifyWebhook
    const { dispatchShopifyOrderCreated, dispatchShopifyOrderUpdated, dispatchWooCommerceOrderCreated } =
      await import('../../modules/platform/events/index.js');

    const ctx = { workspaceId: row.workspace_id };

    if (row.connector_slug === 'shopify') {
      if (row.event_type === 'orders/create') {
        const order = rawPayload as Record<string, unknown>;
        await dispatchShopifyOrderCreated(ctx, {
          workspaceId: row.workspace_id,
          orderId: String(order.id ?? ''),
          orderName: String(order.name ?? ''),
          customerEmail: order.email ? String(order.email) : undefined,
          customerPhone: order.phone ? String(order.phone) : undefined,
          totalPrice: Number(order.total_price ?? 0),
          currency: String(order.currency ?? 'USD'),
          status: String(order.financial_status ?? ''),
          lineItems: ((order.line_items as Record<string, unknown>[] | undefined) ?? []).map((item) => ({
            title: String(item.title ?? ''),
            quantity: Number(item.quantity ?? 1),
            price: Number(item.price ?? 0),
          })),
          rawPayload,
        });
      } else if (row.event_type === 'orders/updated') {
        const order = rawPayload as Record<string, unknown>;
        await dispatchShopifyOrderUpdated(ctx, {
          workspaceId: row.workspace_id,
          orderId: String(order.id ?? ''),
          orderName: String(order.name ?? ''),
          status: String(order.financial_status ?? order.fulfillment_status ?? ''),
          totalPrice: Number(order.total_price ?? 0),
          currency: String(order.currency ?? 'USD'),
          rawPayload,
        });
      }
    } else if (row.connector_slug === 'woocommerce') {
      const order = rawPayload;
      await dispatchWooCommerceOrderCreated(ctx, {
        workspaceId: row.workspace_id,
        orderId: Number(order.id ?? 0),
        customerEmail: order.billing_email ? String(order.billing_email) : undefined,
        total: String(order.total ?? '0'),
        currency: String(order.currency ?? 'USD'),
        status: String(order.status ?? ''),
        rawPayload,
      });
    }

    db.prepare(`
      UPDATE connector_events
         SET status = 'completed', processed_at = datetime('now')
       WHERE id = ?
    `).run(id);

    return res.json({ success: true, eventId: id, status: 'completed' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const newRetryCount = row.retry_count + 1;
    const backoffMinutes = [1, 5, 30, 120, 480];
    const delayMin = backoffMinutes[Math.min(newRetryCount, backoffMinutes.length - 1)];
    const nextRetry = new Date(Date.now() + delayMin * 60 * 1000).toISOString();

    db.prepare(`
      UPDATE connector_events
         SET status = 'failed',
             retry_count = ?,
             last_error = ?,
             next_retry_at = ?
       WHERE id = ?
    `).run(newRetryCount, msg, nextRetry, id);

    return res.status(422).json({
      success: false,
      eventId: id,
      status: 'failed',
      retryCount: newRetryCount,
      nextRetryAt: nextRetry,
      error: msg,
    });
  }
});

export default router;
