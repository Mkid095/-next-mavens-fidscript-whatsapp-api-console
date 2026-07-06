/**
 * sseConnectionHandlers.ts — SSE handlers: dashboard, refresh, publish jobs
 */
import type { Request, Response } from 'express';
import db from '../database.js';
import { verifyToken } from '../middleware/auth/jwt.js';
import { dashboardEmitter } from '../utils/dashboardEmitter.js';
import { publishJobEmitter } from '../utils/publishJobEmitter.js';
import type { PublishJob } from '../types/chatbotDraft.js';
import { setSseHeaders, heartbeat } from './sseShared.js';
import { authSseToken } from './sseAuth.js';
import { buildDashboardPayload } from './sseDashboardStats.js';

// ── Dashboard SSE ──────────────────────────────────────────────────────────────

export function handleDashboardSse(req: Request, res: Response): void {
  const auth = authSseToken(req);
  if (!auth) { res.status(401).json({ success: false, error: 'Invalid or expired token' }); return; }

  const decoded = auth.decoded!;
  setSseHeaders(res);
  res.write(': connected\n\n');

  const timer = heartbeat(res);

  const sendDashboardStats = () => {
    try {
      res.write(`event: dashboardUpdate\ndata: ${JSON.stringify(buildDashboardPayload(decoded.id))}\n\n`);
    } catch (err) {
      console.error('Dashboard SSE stats error:', err);
    }
  };

  sendDashboardStats();

  const msgUpdateHandler = (emittedClientId: string) => {
    if (emittedClientId === decoded.id) sendDashboardStats();
  };

  dashboardEmitter.on('msgUpdate', msgUpdateHandler);

  req.on('close', () => {
    clearInterval(timer);
    dashboardEmitter.off('msgUpdate', msgUpdateHandler);
  });
}

// ── Dashboard Refresh ──────────────────────────────────────────────────────────

export function handleDashboardRefresh(req: Request, res: Response): void {
  const token = (req.headers.authorization as string | undefined)?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ success: false, error: 'Token required' }); return; }
  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'client') { res.status(401).json({ success: false, error: 'Invalid token' }); return; }
  dashboardEmitter.emit('msgUpdate', decoded.id);
  res.json({ success: true });
}

// ── Publish Jobs SSE ───────────────────────────────────────────────────────────

export function handlePublishJobsSse(req: Request, res: Response): void {
  const auth = authSseToken(req);
  if (!auth) { res.status(401).json({ success: false, error: 'Invalid or expired token' }); return; }

  const { client } = auth;
  const jobId = req.params.jobId;

  const job = db.prepare(
    'SELECT * FROM chatbot_publish_jobs WHERE id = ? AND workspace_id = ?'
  ).get(jobId, client.id) as PublishJob | undefined;
  if (!job) { res.status(404).json({ success: false, error: 'Job not found' }); return; }

  setSseHeaders(res);
  res.write(': connected\n\n');

  const timer = heartbeat(res);

  const sendJob = (j: PublishJob) => {
    try { res.write(`event: jobUpdate\ndata: ${JSON.stringify(j)}\n\n`); } catch (_) { /* disconnected */ }
  };

  sendJob(job);

  const jobUpdateHandler = (emittedJobId: string, updatedJob: PublishJob) => {
    if (emittedJobId === jobId) sendJob(updatedJob);
  };

  publishJobEmitter.on('jobUpdated', jobUpdateHandler);

  req.on('close', () => {
    clearInterval(timer);
    publishJobEmitter.off('jobUpdated', jobUpdateHandler);
  });
}
