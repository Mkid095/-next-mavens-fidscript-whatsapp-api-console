import 'dotenv/config';
import express from 'express';
import { initializeDatabase, saveDatabase } from './database.js';
import db from './database.js';
import { registerSearchIndexer } from './modules/platform/search/index.js';
import { registerAnalyticsProjectors } from './modules/platform/analytics/index.js';
import { registerWebhookFanout } from './modules/platform/webhooks/index.js';
import { registerAuditTrail } from './kernel/audit/index.js';
import { registerTriggers } from './modules/campaigns/triggers.js';
import { startDripScheduler } from './modules/campaigns/drip.js';
import { startStatusScheduler } from './modules/campaigns/statusScheduler.js';
import { setupMiddleware } from './middlewareSetup.js';
import { registerInlineRoutes } from './routesRegister.js';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 3001;

export async function startServer(): Promise<void> {
  const app = express();

  // Behind nginx in production — trust one proxy hop so req.ip resolves from
  // X-Forwarded-For and express-rate-limit can key by real client IP.
  app.set('trust proxy', 1);

  try {
    await initializeDatabase();

    // Register event-bus subscribers — the event-driven spine (§5).
    // Without these, bus().emit() fires into the void: search index,
    // analytics rollups would never run.
    registerSearchIndexer();
    registerAnalyticsProjectors();
    registerTriggers();
    registerWebhookFanout();
    registerAuditTrail();
    startDripScheduler();
    startStatusScheduler();
    console.log('✅ Event bus subscribers registered (search, analytics, triggers, webhooks, audit) + drip + status schedulers started');

    // Prune expired idempotency keys on every startup (7-day TTL)
    try {
      const result = db.prepare(`
        DELETE FROM idempotency_keys
        WHERE (expires_at IS NOT NULL AND expires_at < datetime('now'))
           OR (expires_at IS NULL AND created_at < datetime('now', '-7 days'))
      `).run();
      if (result.changes > 0) console.log(`🧹 Pruned ${result.changes} expired idempotency keys`);
    } catch (e) { /* non-fatal */ }

    // Setup middleware and inline routes
    setupMiddleware(app);
    registerInlineRoutes(app);

    // ── API reference (Scalar docs) — served before static middleware ──────
    // GET /api/openapi.json → raw OpenAPI spec JSON
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const openApiPath = path.resolve(__dirname, '..', '..', 'docs', 'openapi.json');

    app.get('/api/openapi.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.sendFile(openApiPath, (err) => {
        if (err) res.status(404).json({ error: 'openapi.json not found. Run from project root.' });
      });
    });

    // GET /api/reference → embedded Scalar API reference UI
    app.get('/api/reference', (_req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>FIDScript API Reference</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📡</text></svg>" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; background: #fff; }
    #scalar-container { height: 100vh; }
  </style>
</head>
<body>
  <div id="scalar-container"></div>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.js"></script>
  <script>
    Scalar.create({
      container: '#scalar-container',
      spec: { url: '/api/openapi.json' },
      pageTitle: 'FIDScript API Reference',
      showSidebar: true,
      defaultOpenAllTags: false,
      theme: 'light',
    });
  </script>
</body>
</html>`);
    });

    // Start server
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 FIDScript WhatsApp API Server                            ║
║   By Next Mavens                                              ║
║                                                               ║
║   Server running on http://localhost:${PORT}                      ║
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
