/**
 * SSE route handlers.
 */
import type { Request, Response } from 'express';
import db from '../../database.js';
import { verifyToken } from '../../middleware/auth/jwt.js';
import { instanceEmitter } from '../../utils/gateway.js';
import { paymentEmitter } from '../../utils/paymentEmitter.js';
import { dashboardEmitter } from '../../utils/dashboardEmitter.js';
import { publishJobEmitter } from '../../utils/publishJobEmitter.js';
import type { Client } from '../../types.js';
import type { PublishJob } from '../../types/chatbotDraft.js';

function authClient(req: Request, res: Response): Client | null {
  const token = req.query.token as string;
  if (!token) { res.status(401).json({ success: false, error: 'Token required' }); return null; }
  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'client') { res.status(401).json({ success: false, error: 'Invalid or expired token' }); return null; }
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND is_active = 1').get(decoded.id) as Client | undefined;
  if (!client) { res.status(401).json({ success: false, error: 'Client not found or inactive' }); return null; }
  return client;
}

function setSseHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

export function registerSseRoutes(router: import('express').Router): void {

  // GET /api/sse/instance/:name
  router.get('/instance/:name', (req: Request, res: Response) => {
    const client = authClient(req, res);
    if (!client) return;

    const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, client.id);
    if (!instance) { res.status(404).json({ success: false, error: 'Instance not found' }); return; }

    const instanceName = req.params.name;
    setSseHeaders(res);
    res.write(': connected\n\n');

    const heartbeat = setInterval(() => { res.write(': heartbeat\n\n'); }, 30000);

    const stateHandler = (emittedName: string, data: { state: string; phoneNumber: string | null }) => {
      if (emittedName === instanceName) res.write(`event: stateChange\ndata: ${JSON.stringify({ name: emittedName, ...data })}\n\n`);
    };
    const messageHandler = (emittedName: string, message: { id: string; from_number: string; from_name: string; message_type: string; content: string; media_url: string | null; timestamp: string }) => {
      if (emittedName === instanceName) res.write(`event: newMessage\ndata: ${JSON.stringify({ name: emittedName, ...message })}\n\n`);
    };
    const receiptHandler = (emittedName: string, data: { chatId: string; messageId: string; status: string }) => {
      if (emittedName === instanceName) res.write(`event: messageReceipt\ndata: ${JSON.stringify({ name: emittedName, ...data })}\n\n`);
    };
    const presenceHandler = (emittedName: string, data: { chatId: string; presence: string; fromName: string | null }) => {
      if (emittedName === instanceName) res.write(`event: presence\ndata: ${JSON.stringify({ name: emittedName, ...data })}\n\n`);
    };

    instanceEmitter.on('stateChange', stateHandler);
    instanceEmitter.on('newMessage', messageHandler);
    instanceEmitter.on('messageReceipt', receiptHandler);
    instanceEmitter.on('presence', presenceHandler);

    req.on('close', () => {
      clearInterval(heartbeat);
      instanceEmitter.off('stateChange', stateHandler);
      instanceEmitter.off('newMessage', messageHandler);
      instanceEmitter.off('messageReceipt', receiptHandler);
      instanceEmitter.off('presence', presenceHandler);
    });
  });

  // GET /api/sse/client
  router.get('/client', (req: Request, res: Response) => {
    const client = authClient(req, res);
    if (!client) return;
    const clientId = client.id;

    setSseHeaders(res);
    res.write(': connected\n\n');
    const heartbeat = setInterval(() => { res.write(': heartbeat\n\n'); }, 30000);

    const tokenUpdateHandler = (emittedClientId: string, data: { balance: number; transaction_id: string; mpesa_receipt?: string }) => {
      if (emittedClientId === clientId) res.write(`event: tokenUpdate\ndata: ${JSON.stringify(data)}\n\n`);
    };
    paymentEmitter.on('tokenUpdate', tokenUpdateHandler);

    req.on('close', () => {
      clearInterval(heartbeat);
      paymentEmitter.off('tokenUpdate', tokenUpdateHandler);
    });
  });

  // GET /api/sse/dashboard
  router.get('/dashboard', (req: Request, res: Response) => {
    const client = authClient(req, res);
    if (!client) return;
    const clientId = client.id;

    setSseHeaders(res);
    res.write(': connected\n\n');
    const heartbeat = setInterval(() => { res.write(': heartbeat\n\n'); }, 30000);

    const sendDashboardStats = () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const todayRow = db.prepare(`SELECT COUNT(*) as count FROM inbox_messages WHERE client_id = ? AND direction = 'outgoing' AND date(timestamp) = ?`).get(clientId, today) as { count: number };
        const dailyVolume = db.prepare(`
          SELECT date(timestamp) as date,
            SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as messages_sent,
            SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as messages_received
          FROM inbox_messages WHERE client_id = ? AND timestamp >= datetime('now', '-7 days')
          GROUP BY date(timestamp) ORDER BY date ASC
        `).all(clientId) as { date: string; messages_sent: number; messages_received: number }[];
        const recentMessages = db.prepare(`
          SELECT im.id, im.from_number, im.from_name, im.message_type, im.content,
                 im.media_url, im.is_read, im.timestamp, im.direction, i.name as instance_name
          FROM inbox_messages im JOIN instances i ON im.instance_id = i.id
          WHERE im.client_id = ? ORDER BY im.timestamp DESC LIMIT 10
        `).all(clientId);
        res.write(`event: dashboardUpdate\ndata: ${JSON.stringify({
          messagesToday: todayRow.count,
          dailyVolume: dailyVolume.map(d => ({ date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), messages_sent: d.messages_sent, messages_delivered: d.messages_received })),
          recentMessages,
        })}\n\n`);
      } catch (err) { console.error('Dashboard SSE stats error:', err); }
    };

    sendDashboardStats();
    const msgUpdateHandler = (emittedClientId: string) => { if (emittedClientId === clientId) sendDashboardStats(); };
    dashboardEmitter.on('msgUpdate', msgUpdateHandler);
    req.on('close', () => { clearInterval(heartbeat); dashboardEmitter.off('msgUpdate', msgUpdateHandler); });
  });

  // POST /api/sse/dashboard/refresh
  router.post('/dashboard/refresh', (req: Request, res: Response) => {
    const token = (req.headers.authorization as string | undefined)?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ success: false, error: 'Token required' }); return; }
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'client') { res.status(401).json({ success: false, error: 'Invalid token' }); return; }
    dashboardEmitter.emit('msgUpdate', decoded.id);
    res.json({ success: true });
  });

  // GET /api/sse/publish-jobs/:jobId
  router.get('/publish-jobs/:jobId', (req: Request, res: Response) => {
    const client = authClient(req, res);
    if (!client) return;

    const job = db.prepare('SELECT * FROM chatbot_publish_jobs WHERE id = ? AND workspace_id = ?')
      .get(req.params.jobId, client.id) as PublishJob | undefined;
    if (!job) { res.status(404).json({ success: false, error: 'Job not found' }); return; }

    setSseHeaders(res);
    res.write(': connected\n\n');
    const heartbeat = setInterval(() => { res.write(': heartbeat\n\n'); }, 30000);

    const sendJob = (j: PublishJob) => { try { res.write(`event: jobUpdate\ndata: ${JSON.stringify(j)}\n\n`); } catch (_) { /* disconnected */ } };
    sendJob(job);

    const jobUpdateHandler = (emittedJobId: string, updatedJob: PublishJob) => { if (emittedJobId === req.params.jobId) sendJob(updatedJob); };
    publishJobEmitter.on('jobUpdated', jobUpdateHandler);
    req.on('close', () => { clearInterval(heartbeat); publishJobEmitter.off('jobUpdated', jobUpdateHandler); });
  });
}
