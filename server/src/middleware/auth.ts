import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import type { User, Client } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fidscript-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
      client?: Client;
      isAdmin?: boolean;
    }
  }
}

// Generate JWT token
export function generateToken(user: User | Client, type: 'admin' | 'client'): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      type,
      name: 'name' in user ? user.name : user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyToken(token: string): { id: string; email: string; type: 'admin' | 'client' } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; type: 'admin' | 'client' };
  } catch {
    return null;
  }
}

// Admin authentication middleware
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization header required',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== 'admin') {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired admin token',
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as User | undefined;
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User not found',
    });
  }

  req.user = user;
  req.isAdmin = true;
  next();
}

// Client API key authentication middleware
export function clientAuth(req: Request, res: Response, next: NextFunction) {
  // Check for API key in header or query param
  const apiKey = req.headers['x-api-key'] as string || req.query.api_key as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required. Provide via X-API-Key header or api_key query param',
    });
  }

  const client = db.prepare('SELECT * FROM clients WHERE api_key = ? AND is_active = 1').get(apiKey) as Client | undefined;
  if (!client) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or inactive API key',
    });
  }

  req.client = client;
  next();
}

// Optional auth - works for both admin and client
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string || req.query.api_key as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded && decoded.type === 'admin') {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as User | undefined;
      if (user) {
        req.user = user;
        req.isAdmin = true;
      }
    }
  } else if (apiKey) {
    const client = db.prepare('SELECT * FROM clients WHERE api_key = ? AND is_active = 1').get(apiKey) as Client | undefined;
    if (client) {
      req.client = client;
    }
  }

  next();
}

// Rate limiter for clients based on their plan
export function clientRateLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.client) {
    return next();
  }

  const client = req.client;
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(client.plan_id) as { msg_per_min: number } | undefined;

  if (!plan) {
    return next();
  }

  // Store rate limit data in memory (in production, use Redis)
  const now = Date.now();
  const key = `rate_${client.id}`;

  // This is a simplified rate limiter - in production use Redis
  if (!(global as { rateLimits?: Record<string, { count: number; resetAt: number }> }).rateLimits) {
    (global as { rateLimits: Record<string, { count: number; resetAt: number }> }).rateLimits = {};
  }

  const rateLimits = (global as { rateLimits: Record<string, { count: number; resetAt: number }> }).rateLimits;
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
    rateLimits[key] = { count: 1, resetAt: now + 60000 }; // Reset every minute
  }

  next();
}
