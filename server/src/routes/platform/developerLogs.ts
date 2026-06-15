import { Router } from 'express';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth/clientJwt.js';

const router = Router();

// =============================================================================
// Developer API logs (§14.2).
// Enriched view: latency_ms + workspace_id columns now exist on api_logs
// (phase6 migration). This route reads them, scoped to the caller's workspace.
// =============================================================================

router.use(clientJwtAuth);

router.get('/', (req, res) => {
  const ws = (req as unknown as { client: { id: string } }).client.id;
  const { method, since, minLatency, limit } = req.query as Record<string, string | undefined>;
  const lim = Math.min(parseInt(limit ?? '100', 10) || 100, 500);

  const where: string[] = ['workspace_id = ?'];
  const args: unknown[] = [ws];
  if (method) { where.push('method = ?'); args.push(method.toUpperCase()); }
  if (since) { where.push('timestamp >= ?'); args.push(since); }
  if (minLatency) {
    const n = parseInt(minLatency, 10);
    if (!Number.isNaN(n)) { where.push('latency_ms >= ?'); args.push(n); }
  }
  args.push(lim);

  const rows = db.prepare(`
    SELECT id, method, endpoint, response_status, latency_ms, ip_address, timestamp
    FROM api_logs
    WHERE ${where.join(' AND ')}
    ORDER BY timestamp DESC LIMIT ?
  `).all(...args);
  res.json({ success: true, data: rows });
});

export default router;
