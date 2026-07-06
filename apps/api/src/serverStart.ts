import 'dotenv/config';
import express from 'express';
import { initializeDatabase, saveDatabase } from './database.js';
import db from './database.js';
import { recoverStaleJobs } from './modules/chatbot/jobRecovery.js';
import { registerSearchIndexer } from './modules/platform/search/index.js';
import { registerAnalyticsProjectors } from './modules/platform/analytics/index.js';
import { registerInboundPipeline } from './modules/ai/index.js';
import { registerAutomations } from './modules/automation/index.js';
import { registerWebhookFanout } from './modules/platform/webhooks/index.js';
import { registerAuditTrail } from './modules/platform/audit/trail.js';
import { registerTriggers } from './modules/campaigns/triggers.js';
import { startDripScheduler } from './modules/campaigns/drip.js';
import { startStatusScheduler } from './modules/campaigns/statusScheduler.js';
import { setupMiddleware } from './middlewareSetup.js';
import { registerInlineRoutes } from './routesRegister.js';

const PORT = process.env.PORT || 3001;

export async function startServer(): Promise<void> {
  const app = express();

  // Behind nginx in production — trust one proxy hop so req.ip resolves from
  // X-Forwarded-For and express-rate-limit can key by real client IP.
  app.set('trust proxy', 1);

  try {
    await initializeDatabase();

    // Recover any stale publish jobs left behind by a previous server crash
    await recoverStaleJobs(db);

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

    // Setup middleware and inline routes
    setupMiddleware(app);
    registerInlineRoutes(app);

    // Start server
    app.listen(PORT, () => {
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
