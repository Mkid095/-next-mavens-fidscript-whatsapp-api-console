import type { Request, Response, NextFunction } from 'express';

/**
 * Stamp the API version on every /api/v1 response, so clients can pin or
 * branch on the contract they received. Cheap, non-breaking, future-proof.
 */
export function v1VersionHeader(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-API-Version', 'v1');
  next();
}
