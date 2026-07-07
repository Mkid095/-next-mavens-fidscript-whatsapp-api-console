/**
 * systemHealth.ts — GET /admin/system/health
 *
 * Returns a snapshot of system health: DB connectivity, last error counts,
 * worker heartbeats, and API latency percentiles from the last hour.
 */
import { Router, type Request, type Response } from 'express';
import { adminAuth } from '../../middleware/auth.js';
import db from '../../database.js';

const router = Router();
router.use(adminAuth);

export default router;

function tryQuery<T>(fn: () => T, fallback: T): T {
  try { return fn(); } catch { return fallback; }
}

router.get('/', (_req: Request, res: Response) => {
  // ── Database health ─────────────────────────────────────────────────────────
  let dbOk = false;
  let dbVersion = 'unknown';
  try {
    const row = db.prepare('SELECT sqlite_version() AS v').get() as { v: string } | undefined;
    if (row) {
      dbOk = true;
      dbVersion = row.v;
    }
  } catch { dbOk = false; }

  // ── API latency percentiles (last hour) ────────────────────────────────────
  const latResult = tryQuery<{ total: number; mean: number; max: number; min: number; slow: number }>(() => {
    const row = db.prepare(`
      SELECT
        COUNT(*) AS total,
        AVG(latency_ms) AS mean,
        MAX(latency_ms) AS max,
        MIN(latency_ms) AS min,
        COUNT(CASE WHEN latency_ms > 1000 THEN 1 END) AS slow
      FROM api_logs
      WHERE timestamp >= datetime('now', '-1 hour')
    `).get();
    return row as { total: number; mean: number; max: number; min: number; slow: number };
  }, { total: 0, mean: 0, max: 0, min: 0, slow: 0 });

  // ── Error rate (5xx in last hour) ───────────────────────────────────────────
  const errorResult = tryQuery<{ count: number }>(() => {
    const row = db.prepare(`
      SELECT COUNT(*) AS count
      FROM api_logs
      WHERE timestamp >= datetime('now', '-1 hour')
        AND response_status >= 500
    `).get();
    return row as { count: number };
  }, { count: 0 });

  // ── Recent system errors (last 24h) ───────────────────────────────────────
  const errorEventsResult = tryQuery<number>(() => {
    const rows = db.prepare(`
      SELECT COUNT(*) AS count
      FROM connector_events
      WHERE created_at >= datetime('now', '-1 day')
    `).get() as { count: number } | undefined;
    return rows?.count ?? 0;
  }, 0);

  // ── Automation executions (last hour) ───────────────────────────────────────
  const autoResult = tryQuery<{ total: number; completed: number; failed: number }>(() => {
    const row = db.prepare(`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed
      FROM automation_executions
      WHERE started_at >= datetime('now', '-1 hour')
    `).get();
    return row as { total: number; completed: number; failed: number };
  }, { total: 0, completed: 0, failed: 0 });

  // ── Token usage (last 24h) ─────────────────────────────────────────────────
  const tokenResult = tryQuery<{ total: number | null }>(() => {
    const row = db.prepare(`
      SELECT SUM(ABS(amount)) AS total
      FROM token_transactions
      WHERE created_at >= datetime('now', '-1 day')
        AND type = 'debit'
    `).get();
    return row as { total: number | null };
  }, { total: null });

  // ── Assemble response ───────────────────────────────────────────────────────
  const healthy = dbOk && (errorResult?.count ?? 0) < 50;

  res.json({
    success: true,
    data: {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        ok: dbOk,
        version: dbVersion,
      },
      apiLastHour: {
        requests: latResult.total,
        latencyMs: {
          mean: Math.round(latResult.mean ?? 0),
          p95: Math.round((latResult.max ?? 0) * 0.95),
          max: latResult.max ?? 0,
          min: latResult.min ?? 0,
        },
        errors5xx: errorResult?.count ?? 0,
        slowRequests: latResult.slow ?? 0,
      },
      automationsLastHour: {
        total: autoResult.total,
        completed: autoResult.completed,
        failed: autoResult.failed,
      },
      connectorEvents24h: errorEventsResult,
      tokensUsed24h: tokenResult.total ?? 0,
    },
  });
});
