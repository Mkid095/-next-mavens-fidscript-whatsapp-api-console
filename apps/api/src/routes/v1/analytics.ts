import { Router, type Request, type Response } from 'express';
import db from '../../database.js';

/**
 * GET /api/v1/analytics/overview - today's metric totals
 * GET /api/v1/analytics?period=day&metric=messages_received - raw rollups
 *
 * Uses client JWT auth (req.client.id = workspace_id).
 * Mirrors /api/platform/analytics but at the public v1 namespace.
 */
const router = Router();

router.get('/overview', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT metric_type, SUM(value) as total
      FROM metric_rollups
      WHERE workspace_id = ? AND period = 'day'
        AND date(period_start) = date('now')
      GROUP BY metric_type
    `).all(req.client!.id) as { metric_type: string; total: number }[];

    const overview: Record<string, number> = {};
    rows.forEach(r => { overview[r.metric_type] = Number(r.total); });
    res.json({ success: true, data: overview });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/', (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'day';
    const metric = req.query.metric as string | undefined;

    let sql = `
      SELECT metric_type, entity_type, period, period_start, value, extra
      FROM metric_rollups
      WHERE workspace_id = ? AND period = ?
    `;
    const params: unknown[] = [req.client!.id, period];
    if (metric) { sql += ' AND metric_type = ?'; params.push(metric); }
    sql += ' ORDER BY metric_type, period_start DESC';

    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
