import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { initializeDatabase } from './database.js';

// Import routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import clientsRoutes from './routes/clients.js';
import plansRoutes from './routes/plans.js';
import instancesRoutes from './routes/instances.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

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

    const apiLimiter = rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 60,
      message: { success: false, error: 'Rate limit exceeded.' },
    });

    // Public routes
    app.use('/api/auth', publicLimiter, authRoutes);
    app.use('/api/stats', publicLimiter, (req, res, next) => {
      req.url = '/stats';
      adminRoutes(req, res, next);
    });

    // Protected API routes
    app.use('/api/admin', apiLimiter, adminRoutes);
    app.use('/api/clients', apiLimiter, clientsRoutes);
    app.use('/api/plans', apiLimiter, plansRoutes);
    app.use('/api/instance', apiLimiter, instancesRoutes);

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
      res.json({
        success: true,
        name: 'FIDScript WhatsApp API',
        version: '1.0.0',
        description: 'WhatsApp API for Kenyan businesses by Next Mavens',
        endpoints: {
          auth: {
            'POST /api/auth/login': 'Admin login',
            'POST /api/auth/register': 'Register first admin',
            'GET /api/auth/me': 'Get current user',
          },
          admin: {
            'GET /api/admin/instances': 'List all instances',
            'GET /api/admin/analytics': 'Platform analytics',
            'GET /api/admin/logs': 'API request logs',
            'GET /api/stats': 'Public platform stats',
          },
          clients: {
            'GET /api/clients': 'List all clients',
            'POST /api/clients': 'Create client',
            'GET /api/clients/:id': 'Get client details',
            'PATCH /api/clients/:id/toggle': 'Enable/disable client',
            'POST /api/clients/:id/reset-key': 'Reset API key',
            'DELETE /api/clients/:id': 'Delete client',
          },
          plans: {
            'GET /api/plans': 'List plans',
            'POST /api/plans': 'Create plan',
            'GET /api/plans/:id': 'Get plan details',
            'PUT /api/plans/:id': 'Update plan',
            'DELETE /api/plans/:id': 'Delete plan',
          },
          instances: {
            'POST /api/instance/create': 'Create instance',
            'GET /api/instance/credentials/:name': 'Get credentials',
            'GET /api/instance/settings/:name': 'Get settings',
            'POST /api/instance/settings/:name': 'Update settings',
            'GET /api/instance/webhook/:name': 'Get webhook config',
            'POST /api/instance/webhook/:name': 'Set webhook config',
            'GET /api/instance/connect/:name': 'Generate QR code',
            'GET /api/instance/connectionState/:name': 'Get connection state',
            'POST /api/instance/sendText/:name': 'Send text message',
            'POST /api/instance/sendMedia/:name': 'Send media message',
            'POST /api/instance/sendLocation/:name': 'Send location',
            'DELETE /api/instance/logout/:name': 'Disconnect instance',
            'DELETE /api/instance/delete/:name': 'Delete instance',
          },
        },
      });
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
║                                                               ║
║   Default admin credentials:                                   ║
║   Email: admin@fidscript.io                                   ║
║   Password: admin123                                          ║
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
