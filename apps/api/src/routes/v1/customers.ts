/**
 * /api/v1/customers - customer read API for external developers.
 * Auth: API key (clientApiKeyAuth). Returns workspace-scoped data.
 */
import { Router, Request, Response } from 'express';
import { clientApiKeyAuth } from '../../middleware/auth.js';
import { V1_READ } from '../../middleware/auth/v1Limits.js';
import db from '../../database.js';

const router = Router();
router.use(clientApiKeyAuth, V1_READ);

function clientId(req: Request): string {
  return req.client!.id;
}

/** GET /api/v1/customers - list customers */
router.get('/', (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = (Number(req.query.offset) || 0);

    let sql = `
      SELECT c.id, c.display_name, c.avatar_url, c.created_at, c.last_seen_at,
             ci.value as primary_identifier, ci.channel
      FROM customers c
      LEFT JOIN customer_identifiers ci ON ci.customer_id = c.id
      WHERE c.workspace_id = ?
    `;
    const params: unknown[] = [clientId(req)];

    if (q) {
      sql += ` AND (c.display_name LIKE ? OR ci.value LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    sql += ` GROUP BY c.id ORDER BY c.last_seen_at DESC NULLS LAST LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params);

    // Count total
    let countSql = `SELECT COUNT(DISTINCT c.id) as total FROM customers c LEFT JOIN customer_identifiers ci ON ci.customer_id = c.id WHERE c.workspace_id = ?`;
    const countParams: unknown[] = [clientId(req)];
    if (q) { countSql += ` AND (c.display_name LIKE ? OR ci.value LIKE ?)`; countParams.push(`%${q}%`, `%${q}%`); }
    const total = (db.prepare(countSql).get(...countParams) as { total: number })?.total ?? 0;

    res.json({ success: true, data: rows, pagination: { limit, offset, total } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** GET /api/v1/customers/:id - customer detail */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const customer = db.prepare(`
      SELECT id, display_name, avatar_url, created_at, last_seen_at
      FROM customers WHERE id = ? AND workspace_id = ?
    `).get(req.params.id, clientId(req));
    if (!customer) { res.status(404).json({ success: false, error: 'Customer not found' }); return; }

    const identifiers = db.prepare(
      'SELECT id, channel, value, label FROM customer_identifiers WHERE customer_id = ? AND workspace_id = ?'
    ).all(req.params.id, clientId(req));
    const tags = db.prepare(
      'SELECT tag, created_at FROM customer_tags WHERE customer_id = ? AND workspace_id = ?'
    ).all(req.params.id, clientId(req));

    res.json({ success: true, data: { ...customer as object, identifiers, tags } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** POST /api/v1/customers - create a customer record */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { display_name, channel, identifier_value, identifier_label } = req.body as {
      display_name?: string;
      channel?: string;
      identifier_value?: string;
      identifier_label?: string;
    };

    const customerId = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`
      INSERT INTO customers (id, workspace_id, display_name, avatar_url, created_at, last_seen_at)
      VALUES (?, ?, ?, NULL, datetime('now'), datetime('now'))
    `).run(customerId, clientId(req), display_name ?? null);

    if (identifier_value) {
      const identId = `cident_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      db.prepare(`
        INSERT INTO customer_identifiers (id, customer_id, workspace_id, channel, value, label, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(identId, customerId, clientId(req), channel ?? 'whatsapp', identifier_value, identifier_label ?? null);
    }

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    res.status(201).json({ success: true, data: customer });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** PATCH /api/v1/customers/:id - update a customer */
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const { display_name } = req.body as { display_name?: string };
    const existing = db.prepare('SELECT id FROM customers WHERE id = ? AND workspace_id = ?').get(req.params.id, clientId(req));
    if (!existing) { res.status(404).json({ success: false, error: 'Customer not found' }); return; }

    if (display_name !== undefined) {
      db.prepare('UPDATE customers SET display_name = ? WHERE id = ? AND workspace_id = ?')
        .run(display_name, req.params.id, clientId(req));
    }

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** DELETE /api/v1/customers/:id - remove a customer */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare('SELECT id FROM customers WHERE id = ? AND workspace_id = ?').get(req.params.id, clientId(req));
    if (!existing) { res.status(404).json({ success: false, error: 'Customer not found' }); return; }

    // Soft delete identifiers
    db.prepare('UPDATE customer_identifiers SET label = label || \' [deleted]\' WHERE customer_id = ? AND workspace_id = ?')
      .run(req.params.id, clientId(req));
    db.prepare('DELETE FROM customers WHERE id = ? AND workspace_id = ?')
      .run(req.params.id, clientId(req));
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/** GET /api/v1/customers/:id/timeline - domain events */
router.get('/:id/timeline', (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const owned = db.prepare(
      'SELECT 1 FROM customers WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, clientId(req));
    if (!owned) { res.status(404).json({ success: false, error: 'Customer not found' }); return; }

    const events = db.prepare(`
      SELECT id, type, entity_type, entity_id, conversation_id, actor_user_id,
             payload, created_at
      FROM domain_events
      WHERE workspace_id = ? AND customer_id = ?
      ORDER BY created_at DESC LIMIT ?
    `).all(clientId(req), req.params.id, limit);

    res.json({ success: true, data: events });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
