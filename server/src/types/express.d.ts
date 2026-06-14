import type { Client, User } from './entities.js';

/**
 * Augment Express Request to include custom properties set by middleware.
 * clientJwtAuth sets req.client
 * adminAuth sets req.user and req.isAdmin
 */
declare global {
  namespace Express {
    interface Request {
      client?: Client;
      user?: User;
      isAdmin?: boolean;
    }
  }
}

export {};
