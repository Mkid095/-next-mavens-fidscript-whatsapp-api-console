import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { initializeDatabase, saveDatabase } from './database.js';
import db from './database.js';
import { registerRoutes } from './routes/index.js';
import { apiInfo } from './utils/apiInfo.js';
import { registerSearchIndexer } from './modules/platform/search/index.js';
import { registerAnalyticsProjectors } from './modules/platform/analytics/index.js';
import { registerInboundPipeline } from './modules/ai/index.js';
import { registerAutomations } from './modules/automation/index.js';
import { registerWebhookFanout } from './modules/platform/webhooks/index.js';
import { registerAuditTrail } from './modules/platform/audit/trail.js';
import { responseTimeMiddleware } from './modules/platform/audit/writer.js';
import { registerTriggers } from './modules/campaigns/triggers.js';
import { startDripScheduler } from './modules/campaigns/drip.js';
import { startStatusScheduler } from './modules/campaigns/statusScheduler.js';

import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;
// Behind nginx in production — trust one proxy hop so req.ip resolves from
// X-Forwarded-For and express-rate-limit can key by real client IP.
app.set('trust proxy', 1);

async function startServer() {
  try {
    await initializeDatabase();

    // Register event-bus subscribers — the event-driven spine (§5).
    // Without these, bus().emit() fires into the void: search index,
    // analytics rollups, and the AI inbound pipeline would never run.
    registerSearchIndexer();
    registerAnalyticsProjectors();
    registerInboundPipeline();
    registerAutomations();
    registerTriggers();
    registerWebhookFanout();
    registerAuditTrail();
    startDripScheduler();
    startStatusScheduler();
    console.log('✅ Event bus subscribers registered (search, analytics, AI, automations, triggers, webhooks, audit) + drip + status schedulers started');

    // Prune expired idempotency keys on every startup (7-day TTL)
    try {
      const result = db.prepare(`
        DELETE FROM idempotency_keys
        WHERE (expires_at IS NOT NULL AND expires_at < datetime('now'))
           OR (expires_at IS NULL AND created_at < datetime('now', '-7 days'))
      `).run();
      if (result.changes > 0) console.log(`🧹 Pruned ${result.changes} expired idempotency keys`);
    } catch (e) { /* non-fatal */ }

    // Security middleware
    app.use(helmet());
    app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));

    // Request parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Response-time tracking — stamps res.locals._t0 so the api_logs writer
    // (called by middleware routes) can compute latency_ms and stamp
    // workspace_id when the request is workspace-scoped (§14.2).
    app.use(responseTimeMiddleware());

    // Logging
    app.use(morgan('dev'));

    // Rate limiting for public endpoints
    const publicLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { success: false, error: 'Too many requests, please try again later.' },
    });

    // Public routes
    app.use('/api/auth', publicLimiter, authRoutes);

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

        // Compute real delivery rate from api_logs
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

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 FIDScript WhatsApp API Server                            ║
║   By Next Mavens                                              ║
║                                                               ║
║   Server running on http://localhost:${PORT}                    ║
║   Passwordless auth — magic-code login                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
