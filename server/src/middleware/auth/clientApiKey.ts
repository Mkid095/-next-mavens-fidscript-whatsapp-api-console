import { Request, Response, NextFunction } from 'express';
import db from '../../database.js';
import type { Client } from '../../types.js';

export function clientAuth(req: Request, res: Response, next: NextFunction) {
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
