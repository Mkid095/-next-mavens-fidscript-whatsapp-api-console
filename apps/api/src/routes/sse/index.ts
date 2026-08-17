/**
 * SSE route barrel - thin re-export.
 */
import { Router } from 'express';
import { registerSseRoutes } from './sseRouter.js';

const router: Router = Router();
registerSseRoutes(router);
export default router;
