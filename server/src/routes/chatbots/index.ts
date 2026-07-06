/**
 * Chatbots route barrel — thin re-export.
 */
import { Router } from 'express';
import { registerChatbotRoutes } from './chatbotRouter';

const router: Router = Router();
registerChatbotRoutes(router);
export default router;
