import type { User, Client } from './types.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      client?: Client;
      isAdmin?: boolean;
    }
  }
}

export {};
