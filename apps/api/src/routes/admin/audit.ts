import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { adminAuth } from '../../middleware/auth.js';

const router = Router();
router.use(adminAuth);

/**
 * GET /api/admin/audit/events
 * Platform admin audit log — returns all audit_logs rows across all workspaces.
 * Protected: adminAuth middleware.
 */
router.get('/events', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const offset = (page - 1) * limit;

    const actorId = req.query.actorId as string | undefined;
    const actorType = req.query.actorType as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;
    const eventType = req.query.eventType as string | undefined;
    const ipAddress = req.query.ipAddress as string | undefined;
    const failedOnly = req.query.failedOnly === 'true';
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const search = req.query.search as string | undefined;

    const where: string[] = [];
    const args: (string | number)[] = [];

    if (actorId) { where.push('actor_user_id = ?'); args.push(actorId); }
    if (actorType) { where.push('actor_user_id LIKE ?'); args.push(actorType === 'system' ? 'system' : `%${actorType}%`); }
    if (resourceType) { where.push('entity_type = ?'); args.push(resourceType); }
    if (eventType) { where.push('action = ?'); args.push(eventType); }
    if (ipAddress) { where.push('ip_address = ?'); args.push(ipAddress); }
    if (failedOnly) { where.push("(action LIKE '%failed%' OR action LIKE '%error%')"); }
    if (fromDate) { where.push('timestamp >= ?'); args.push(fromDate); }
    if (toDate) { where.push('timestamp <= ?'); args.push(toDate); }
    if (search) { where.push('(action LIKE ? OR entity_type LIKE ? OR entity_id LIKE ?)'); args.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`).get(...args) as { count: number };
    const total = countRow.count;

    const rows = db.prepare(`
      SELECT id, actor_user_id, action, entity_type, entity_id,
             details, before_json, after_json, ip_address, timestamp
      FROM audit_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).all(...args, limit, offset);

    const events = rows.map((row: Record<string, unknown>) => {
      // Determine actorType based on actor string
      const rawActor = String(row.actor_user_id ?? '');
      let actorType: 'user' | 'system' | 'api_key' = 'user';
      if (rawActor === 'system') actorType = 'system';
      else if (rawActor.startsWith('key_') || rawActor.includes('api_key')) actorType = 'api_key';

      let metadata: Record<string, unknown> = {};
      if (row.details) {
        try { metadata = JSON.parse(row.details as string); } catch { metadata = { details: row.details }; }
      }
      if (row.before_json) {
        try { metadata.before = JSON.parse(row.before_json as string); } catch {}
      }
      if (row.after_json) {
        try { metadata.after = JSON.parse(row.after_json as string); } catch {}
      }

      return {
        id: row.id,
        type: row.action,
        timestamp: row.timestamp,
        actorId: row.actor_user_id ?? null,
        actorType,
        resourceType: row.entity_type ?? null,
        resourceId: row.entity_id ?? null,
        metadata,
        ipAddress: row.ip_address ?? null,
        userAgent: null,
      };
    });

    res.json({
      success: true,
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
