/**
 * sseInstanceHandler.ts - instance SSE handler
 */
import type { Request, Response } from 'express';
import db from '../database.js';
import { instanceEmitter } from '../utils/gateway.js';
import { setSseHeaders, heartbeat } from './sseShared.js';
import { authSseToken } from './sseAuth.js';

export function handleInstanceSse(req: Request, res: Response): void {
  const auth = authSseToken(req);
  if (!auth) { res.status(401).json({ success: false, error: 'Invalid or expired token' }); return; }

  const { client } = auth;
  const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, client.id);
  if (!instance) { res.status(404).json({ success: false, error: 'Instance not found' }); return; }

  const instanceName = req.params.name;
  setSseHeaders(res);
  res.write(': connected\n\n');

  const timer = heartbeat(res);

  const stateHandler = (emittedName: string, data: { state: string; phoneNumber: string | null }) => {
    if (emittedName === instanceName) res.write(`event: stateChange\ndata: ${JSON.stringify({ name: emittedName, ...data })}\n\n`);
  };
  const messageHandler = (emittedName: string, message: { id: string; from_number: string; from_name: string; message_type: string; content: string; media_url: string | null; timestamp: string; chat_id: string; is_group: number }) => {
    if (emittedName === instanceName) res.write(`event: newMessage\ndata: ${JSON.stringify({ name: emittedName, ...message })}\n\n`);
  };
  const sentHandler = (emittedName: string, message: { id: string; from_number: string; from_name: string; message_type: string; content: string; media_url: string | null; timestamp: string; chat_id: string; is_group: number }) => {
    if (emittedName === instanceName) res.write(`event: messageSent\ndata: ${JSON.stringify({ name: emittedName, ...message })}\n\n`);
  };
  const receiptHandler = (emittedName: string, data: { chatId: string; messageId: string; status: string }) => {
    if (emittedName === instanceName) res.write(`event: messageReceipt\ndata: ${JSON.stringify({ name: emittedName, ...data })}\n\n`);
  };
  const presenceHandler = (emittedName: string, data: { chatId: string; presence: string; fromName: string | null }) => {
    if (emittedName === instanceName) res.write(`event: presence\ndata: ${JSON.stringify({ name: emittedName, ...data })}\n\n`);
  };
  const aiOverrideHandler = (emittedName: string, data: { chatId: string; mode: string }) => {
    if (emittedName === instanceName) res.write(`event: aiOverrideChanged\ndata: ${JSON.stringify({ name: emittedName, ...data })}\n\n`);
  };

  instanceEmitter.on('stateChange', stateHandler);
  instanceEmitter.on('newMessage', messageHandler);
  instanceEmitter.on('messageSent', sentHandler);
  instanceEmitter.on('messageReceipt', receiptHandler);
  instanceEmitter.on('presence', presenceHandler);
  instanceEmitter.on('aiOverrideChanged', aiOverrideHandler);

  req.on('close', () => {
    clearInterval(timer);
    instanceEmitter.off('stateChange', stateHandler);
    instanceEmitter.off('newMessage', messageHandler);
    instanceEmitter.off('messageSent', sentHandler);
    instanceEmitter.off('messageReceipt', receiptHandler);
    instanceEmitter.off('presence', presenceHandler);
    instanceEmitter.off('aiOverrideChanged', aiOverrideHandler);
  });
}
