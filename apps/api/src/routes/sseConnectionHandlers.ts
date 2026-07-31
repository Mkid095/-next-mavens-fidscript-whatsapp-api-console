/**
 * sseConnectionHandlers.ts — SSE handlers: dashboard, refresh
 */
import type { Request, Response } from 'express';
import { verifyToken } from '../middleware/auth/jwt.js';
import { dashboardEmitter } from '../utils/dashboardEmitter.js';
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
