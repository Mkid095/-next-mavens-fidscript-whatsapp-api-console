import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import db from '../../database.js';

// =============================================================================
// /api/platform/customers - customer-centric reads (§6).
// Workspace-scoped via req.client.id (= workspace_id bridge).
// =============================================================================

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string {
  return req.client!.id;
}

// GET / - list customers (optional ?q= name/identifier search, ?limit=)
router.get('/', (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    let sql = `
      SELECT c.id, c.display_name, c.avatar_url, c.created_at, c.last_seen_at,
             ci.value as primary_identifier, ci.channel
      FROM customers c
      LEFT JOIN customer_identifiers ci ON ci.customer_id = c.id
      WHERE c.workspace_id = ?
    `;
    const params: unknown[] = [wsId(req)];

    if (q) {
      sql += ` AND (c.display_name LIKE ? OR ci.value LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }
    sql += ` GROUP BY c.id ORDER BY c.last_seen_at DESC NULLS LAST LIMIT ?`;
    params.push(limit);

    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /:id - customer detail (identifiers + tags)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const customer = db.prepare(`
      SELECT id, display_name, avatar_url, created_at, last_seen_at
      FROM customers WHERE id = ? AND workspace_id = ?
    `).get(req.params.id, wsId(req));
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    const identifiers = db.prepare(
      'SELECT id, channel, value, label FROM customer_identifiers WHERE customer_id = ? AND workspace_id = ?'
    ).all(req.params.id, wsId(req));
    const tags = db.prepare(
      'SELECT tag, created_at FROM customer_tags WHERE customer_id = ? AND workspace_id = ?'
    ).all(req.params.id, wsId(req));
    res.json({ success: true, data: { ...customer as object, identifiers, tags } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /:id/timeline - domain_events for this customer (§7)
router.get('/:id/timeline', (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    // Verify ownership
    const owned = db.prepare(
      'SELECT 1 FROM customers WHERE id = ? AND workspace_id = ?'
    ).get(req.params.id, wsId(req));
    if (!owned) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    const events = db.prepare(`
      SELECT id, type, entity_type, entity_id, conversation_id, actor_user_id,
             payload, created_at
      FROM domain_events
      WHERE workspace_id = ? AND customer_id = ?
      ORDER BY created_at DESC LIMIT ?
    `).all(wsId(req), req.params.id, limit);
    res.json({ success: true, data: events });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
