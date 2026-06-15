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

import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;
// Behind nginx in production — trust one proxy hop so req.ip resolves from
// X-Forwarded-For and express-rate-limit can key by real client IP.
app.set('trust proxy', 1);

async function startServer() {
  try {
    await initializeDatabase();

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

        res.json({
          success: true,
          data: {
            total_clients: clientStats?.total_clients || 0,
            total_messages: clientStats?.total_messages || 0,
            active_instances: instanceStats?.connected_instances || 0,
            messages_today: messagesToday?.messages_today || 0,
            delivery_rate: 98.5,
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
