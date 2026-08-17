/**
 * Conversations route barrel - thin re-export.
 */
import { Router } from 'express';
import { registerConversationRoutes } from './conversationsRouter.js';

const router: Router = Router();
registerConversationRoutes(router);
export default router;
