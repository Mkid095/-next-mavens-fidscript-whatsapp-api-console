import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../database.js';
import type { User } from '../../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fidscript-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export function generateToken(user: User, type: 'admin' | 'client'): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      type,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): { id: string; email: string; type: 'admin' | 'client' } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; type: 'admin' | 'client' };
  } catch {
    return null;
  }
}

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
