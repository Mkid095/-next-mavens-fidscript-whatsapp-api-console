import { Router, Request, Response } from 'express';
import db from '../database.js';
import { verifyToken } from '../middleware/auth/jwt.js';
import { instanceEmitter } from '../utils/evolution.js';
import type { Client } from '../types.js';

const router = Router();

/**
 * GET /api/sse/instance/:name
 * SSE endpoint for real-time instance connection state updates.
 * Clients subscribe to receive events when the instance's connection state changes.
 * Auth via query param: ?token=<client_jwt>
 */
router.get('/instance/:name', (req: Request, res: Response) => {
  // Authenticate via query param (EventSource doesn't support headers)
  const token = req.query.token as string;
  if (!token) {
    res.status(401).json({ success: false, error: 'Token required' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'client') {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return;
  }

  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND is_active = 1').get(decoded.id) as Client | undefined;
  if (!client) {
    res.status(401).json({ success: false, error: 'Client not found or inactive' });
    return;
  }

  // Verify instance belongs to this client
  const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, client.id);
  if (!instance) {
    res.status(404).json({ success: false, error: 'Instance not found' });
    return;
  }

  const instanceName = req.params.name;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Send initial heartbeat comment to establish connection
  res.write(': connected\n\n');

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000); // Heartbeat every 30s

  // Handler for state change events on this instance
  const stateHandler = (emittedName: string, data: { state: string; phoneNumber: string | null }) => {
    if (emittedName === instanceName) {
      res.write(`data: ${JSON.stringify({ name: emittedName, ...data })}\n\n`);
    }
  };

  instanceEmitter.on('stateChange', stateHandler);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    instanceEmitter.off('stateChange', stateHandler);
  });
});

export default router;
