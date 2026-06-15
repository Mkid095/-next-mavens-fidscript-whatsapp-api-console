import type { Client, User } from './entities.js';

/**
 * Augment Express Request to include custom properties set by middleware.
 * clientJwtAuth / clientApiKeyAuth set req.client
 * clientApiKeyAuth also sets req.apiKeyId (the client_api_keys.id used)
 * adminAuth sets req.user and req.isAdmin
 */
declare global {
  namespace Express {
    interface Request {
      client?: Client;
      user?: User;
      isAdmin?: boolean;
      apiKeyId?: string;
    }
  }
}

export {};
