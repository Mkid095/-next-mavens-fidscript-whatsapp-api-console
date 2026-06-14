import { Request, Response, NextFunction } from 'express';
import db from '../../database.js';
import type { Client, User } from '../../types.js';
import { verifyToken } from './jwt.js';

export function clientJwtAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization header required',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== 'client') {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired client token',
    });
  }

  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND is_active = 1').get(decoded.id) as Client | undefined;
  if (!client) {
    return res.status(401).json({
      success: false,
      error: 'Client not found or inactive',
    });
  }

  req.client = client;
  next();
}

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
