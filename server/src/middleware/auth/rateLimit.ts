import { Request, Response, NextFunction } from 'express';
import db from '../../database.js';

type RateLimitStore = { rateLimits: Record<string, { count: number; resetAt: number }> };

export function clientRateLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.client) {
    return next();
  }

  const client = req.client;
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(client.plan_id) as { msg_per_min: number } | undefined;

  if (!plan) {
    return next();
  }

  const now = Date.now();
  const key = `rate_${client.id}`;

  if (!(global as unknown as RateLimitStore).rateLimits) {
    (global as unknown as RateLimitStore).rateLimits = {};
  }

  const rateLimits = (global as unknown as RateLimitStore).rateLimits;
  const clientLimit = rateLimits[key];

  if (clientLimit && clientLimit.resetAt > now) {
    if (clientLimit.count >= plan.msg_per_min) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before sending more messages.',
        retryAfter: Math.ceil((clientLimit.resetAt - now) / 1000),
      });
    }
    clientLimit.count++;
  } else {
    rateLimits[key] = { count: 1, resetAt: now + 60000 };
  }

  next();
}
