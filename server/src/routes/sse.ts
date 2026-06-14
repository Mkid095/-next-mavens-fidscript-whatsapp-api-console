import { Router, Request, Response } from 'express';
import db from '../database.js';
import { verifyToken } from '../middleware/auth/jwt.js';
import { instanceEmitter } from '../utils/evolution.js';
import { paymentEmitter } from '../utils/paymentEmitter.js';
import type { Client } from '../types.js';

const router = Router();

/**
 * GET /api/sse/instance/:name
 * SSE endpoint for real-time instance connection state and inbox message updates.
 * Auth via query param: ?token=<client_jwt>
 */
router.get('/instance/:name', (req: Request, res: Response) => {
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

  const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, client.id);
  if (!instance) {
    res.status(404).json({ success: false, error: 'Instance not found' });
    return;
  }

  const instanceName = req.params.name;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(': connected\n\n');

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Broadcast connection state changes
  const stateHandler = (emittedName: string, data: { state: string; phoneNumber: string | null }) => {
    if (emittedName === instanceName) {
      res.write(`event: stateChange\ndata: ${JSON.stringify({ name: emittedName, ...data })}\n\n`);
    }
  };

  // Broadcast new inbox messages
  const messageHandler = (emittedName: string, message: { id: string; from_number: string; from_name: string; message_type: string; content: string; media_url: string | null; timestamp: string }) => {
    if (emittedName === instanceName) {
      res.write(`event: newMessage\ndata: ${JSON.stringify({ name: emittedName, ...message })}\n\n`);
    }
  };

  instanceEmitter.on('stateChange', stateHandler);
  instanceEmitter.on('newMessage', messageHandler);

  req.on('close', () => {
    clearInterval(heartbeat);
    instanceEmitter.off('stateChange', stateHandler);
    instanceEmitter.off('newMessage', messageHandler);
  });
});

/**
 * GET /api/sse/client
 * SSE endpoint for client-scoped events: token updates, payment status.
 * Auth via query param: ?token=<client_jwt>
 * No rate limiting (long-lived connection).
 */
router.get('/client', (req: Request, res: Response) => {
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

  const clientId = decoded.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(': connected\n\n');

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Forward token updates to this SSE connection
  const tokenUpdateHandler = (emittedClientId: string, data: { balance: number; transaction_id: string; mpesa_receipt?: string }) => {
    if (emittedClientId === clientId) {
      res.write(`event: tokenUpdate\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  paymentEmitter.on('tokenUpdate', tokenUpdateHandler);

  req.on('close', () => {
    clearInterval(heartbeat);
    paymentEmitter.off('tokenUpdate', tokenUpdateHandler);
  });
});

export default router;
