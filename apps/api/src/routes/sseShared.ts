/**
 * sseShared.ts - shared SSE helpers
 */
import type { Response } from 'express';

export function setSseHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

export function heartbeat(res: Response, intervalMs = 30000): ReturnType<typeof setInterval> {
  return setInterval(() => { res.write(': heartbeat\n\n'); }, intervalMs);
}
