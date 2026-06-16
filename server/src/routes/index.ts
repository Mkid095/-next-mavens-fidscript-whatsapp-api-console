import { Router } from 'express';
import type { Express } from 'express';
import rateLimit from 'express-rate-limit';
import adminRoutes from './admin.js';
import authRoutes from './auth/index.js';
import clientsRoutes from './clients.js';
import plansRoutes from './plans.js';
import instancesRoutes from './instances.js';
import paymentsRoutes from './payments.js';
import uploadsRoutes from './uploads.js';
import contactsRoutes from './contacts.js';
import contactGroupsRoutes from './contactGroups.js';
import clientMessagesRoutes from './clientMessages.js';
import clientKeysRoutes from './clientKeys.js';
import campaignsRoutes from './campaigns.js';
import sseRoutes from './sse.js';
import versionsRoutes from './versions.js';
import webhookRoutes from './webhook.js';
import sandboxRoutes from './sandbox.js';
import v1Routes from './v1/index.js';
import platformRoutes from './platform/index.js';

export function registerRoutes(app: Express): void {
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: { success: false, error: 'Rate limit exceeded.' },
  });

  // Platform UI limiter — client-JWT, workspace-scoped reads + writes used by the
  // inbox/dashboard. These surfaces legitimately burst: opening a conversation fires
  // ~5 drawer reads (customer + tags + notes + assignment + timeline) plus thread
  // messages + group info, and realtime events re-pull the list. 60/min (the legacy
  // apiLimiter) caps an agent at ~8 inbox interactions — guaranteeing 429 storms.
  // 600/min matches the public /api/v1 read budget and gives ~10x headroom while
  // still throttling abuse (every route still requires a valid client JWT).
  const platformLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Slow down.' },
  });

  // Auth routes (no rate limit on login/register)
  app.use('/api/auth', authRoutes);

  // Protected API routes
  app.use('/api/admin', apiLimiter, adminRoutes);
  app.use('/api/clients', apiLimiter, clientsRoutes);
  app.use('/api/plans', apiLimiter, plansRoutes);
  app.use('/api/instance', apiLimiter, instancesRoutes);
  app.use('/api/payments', apiLimiter, paymentsRoutes);
  app.use('/api/uploads', apiLimiter, uploadsRoutes);
  app.use('/api/contacts', apiLimiter, contactsRoutes);
  app.use('/api/groups', apiLimiter, contactGroupsRoutes);
  app.use('/api/client/messages', apiLimiter, clientMessagesRoutes);
  app.use('/api/client/keys', apiLimiter, clientKeysRoutes);
  app.use('/api/campaigns', apiLimiter, campaignsRoutes);
  app.use('/api/sse', sseRoutes);
  app.use('/api/versions', versionsRoutes);
  // Webhook endpoint for Evolution API events (no rate limit — authenticated via API key)
  app.use('/api/webhook', webhookRoutes);
  app.use('/api/sandbox', apiLimiter, sandboxRoutes);
  // Public API namespace for external integrators (API-key auth, own rate limit)
  app.use('/api/v1', v1Routes);
  // Platform API — customer-centric reads + operational writes (client JWT, workspace-scoped)
  app.use('/api/platform', platformLimiter, platformRoutes);
}
