import express, { Express } from 'express';
import db from './database.js';
import { registerRoutes } from './routes/index.js';
import { apiInfo } from './utils/apiInfo.js';

/**
 * Registers the stats, health-check, info, 404, and error routes.
 * Route registration (registerRoutes from routes/index.ts) is called here too.
 */
export function registerInlineRoutes(app: Express): void {
  // Public stats endpoint
  app.get('/api/stats', (req: express.Request, res: express.Response) => {
    try {
      const clientStats = db.prepare(`
        SELECT
          COUNT(*) as total_clients,
          COALESCE(SUM(total_messages), 0) as total_messages
        FROM clients
      `).get() as any;

      const instanceStats = db.prepare(`
        SELECT
          COUNT(*) as total_instances,
          SUM(CASE WHEN status = 'connected' THEN 1 ELSE 0 END) as connected_instances
        FROM instances
      `).get() as any;

      const messagesToday = db.prepare(`
        SELECT COALESCE(SUM(msg_count_today), 0) as messages_today FROM clients
      `).get() as any;

      const deliveryStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as successful
        FROM api_logs
        WHERE endpoint LIKE '/api/v1/send%'
      `).get() as { total: number; successful: number } | undefined;
      const deliveryRate = deliveryStats && deliveryStats.total > 0
        ? Math.round((deliveryStats.successful / deliveryStats.total) * 1000) / 10
        : null;

      res.json({
        success: true,
        data: {
          total_clients: clientStats?.total_clients || 0,
          total_messages: clientStats?.total_messages || 0,
          active_instances: instanceStats?.connected_instances || 0,
          messages_today: messagesToday?.messages_today || 0,
          delivery_rate: deliveryRate ?? 100,
          uptime: '99.9%',
        },
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
  });

  // Register protected routes
  registerRoutes(app);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'FIDScript API Server is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API info endpoint
  app.get('/api', (req, res) => {
    res.json(apiInfo);
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
    });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server Error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  });
}
