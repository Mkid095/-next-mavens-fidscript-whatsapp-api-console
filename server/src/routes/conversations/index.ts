/**
 * Conversations route barrel — thin re-export.
 */
import { Router } from 'express';
import { registerConversationRoutes } from './conversationsRouter';

const router: Router = Router();
registerConversationRoutes(router);
export default router;
