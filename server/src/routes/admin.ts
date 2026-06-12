import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { adminAuth } from '../middleware/auth.js';
import type { Instance, Client, ApiLog, AuditLog, AnalyticsData } from '../types.js';

const router = Router();

// Apply admin auth to all routes
router.use(adminAuth);

// Log admin action to audit log
function logAuditAction(req: Request, action: string, entityType: string, entityId: string, details?: string) {
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), req.user?.id, action, entityType, entityId, details || null, req.ip);
}

// GET /api/admin/instances - List all instances
router.get('/instances', (req: Request, res: Response) => {
  try {
    const instances = db.prepare(`
      SELECT i.*, c.name as client_name
      FROM instances i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
    `).all();

    res.json({
      success: true,
      data: instances,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch instances' });
  }
});

// GET /api/admin/analytics - Get platform analytics
router.get('/analytics', (req: Request, res: Response) => {
  try {
    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM clients WHERE is_active = 1) as active_clients,
        (SELECT COUNT(*) FROM instances) as total_instances,
        (SELECT COUNT(*) FROM instances WHERE status = 'connected') as connected_instances,
        (SELECT COALESCE(SUM(msg_count_today), 0) FROM clients) as messages_today,
        (SELECT COALESCE(SUM(total_messages), 0) FROM clients) as messages_this_month
    `).get() as {
      total_clients: number;
      active_clients: number;
      total_instances: number;
      connected_instances: number;
      messages_today: number;
      messages_this_month: number;
    };

    // Calculate delivery rate (simplified)
    const deliveryRate = stats.messages_today > 0
      ? ((stats.messages_today - Math.floor(stats.messages_today * 0.02)) / stats.messages_today * 100)
      : 100;

    // Get top clients
    const topClients = db.prepare(`
      SELECT c.id as client_id, c.name as client_name, c.total_messages,
        (SELECT COUNT(*) FROM instances WHERE client_id = c.id AND status = 'connected') as active_instances
      FROM clients c
      ORDER BY c.total_messages DESC
      LIMIT 5
    `).all();

    // Get top instances
    const topInstances = db.prepare(`
      SELECT i.id as instance_id, i.name as instance_name, c.name as client_name,
        i.total_messages, i.status
      FROM instances i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.total_messages DESC
      LIMIT 5
    `).all();

    // Generate daily trends (last 7 days)
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // In production, this would query actual logs
      const messagesSent = Math.floor(Math.random() * 5000) + 1000;
      dailyTrends.push({
        date: dateStr,
        messages_sent: messagesSent,
        messages_delivered: Math.floor(messagesSent * 0.98),
        failed_messages: Math.floor(messagesSent * 0.02),
      });
    }

    const analytics: AnalyticsData = {
      ...stats,
      delivery_rate: Math.round(deliveryRate * 100) / 100,
      daily_trends: dailyTrends,
      top_clients: topClients as AnalyticsData['top_clients'],
      top_instances: topInstances as AnalyticsData['top_instances'],
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// GET /api/admin/logs - Get API request logs
router.get('/logs', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const logs = db.prepare(`
      SELECT l.*, i.name as instance_name, c.name as client_name
      FROM api_logs l
      LEFT JOIN instances i ON l.instance_id = i.id
      LEFT JOIN clients c ON l.client_id = c.id
      ORDER BY l.timestamp DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM api_logs').get() as { count: number };

    res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

// GET /api/stats - Platform-level stats (public)
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM clients WHERE is_active = 1) as active_clients,
        (SELECT COALESCE(SUM(msg_count_today), 0) FROM clients) as messages_today
    `).get();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
