import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import db from '../../database.js';

// =============================================================================
// /api/platform/analytics - metric rollups (§13).
// Workspace-scoped aggregates computed by the AnalyticsProjectors.
// =============================================================================

const router = Router();
router.use(clientJwtAuth);

function wsId(req: Request): string {
  return req.client!.id;
}

// GET /?period=day&metric=messages_received
// GET /overview - a prebuilt dashboard summary of the common metrics
router.get('/', (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'day';
    const metric = req.query.metric as string | undefined;

    let sql = `
      SELECT metric_type, entity_type, period, period_start, value, extra
      FROM metric_rollups
      WHERE workspace_id = ? AND period = ?
    `;
    const params: unknown[] = [wsId(req), period];
    if (metric) { sql += ' AND metric_type = ?'; params.push(metric); }
    sql += ' ORDER BY metric_type, period_start DESC';

    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /overview - summed counts per metric for the current day (inbox dashboards)
router.get('/overview', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT metric_type, SUM(value) as total
      FROM metric_rollups
      WHERE workspace_id = ? AND period = 'day'
        AND date(period_start) = date('now')
      GROUP BY metric_type
    `).all(wsId(req)) as { metric_type: string; total: number }[];

    const overview: Record<string, number> = {};
    rows.forEach(r => { overview[r.metric_type] = Number(r.total); });
    res.json({ success: true, data: overview });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
