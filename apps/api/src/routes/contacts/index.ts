/**
 * Contacts route barrel — thin re-export.
 */
import { Router } from 'express';
import { registerContactsRoutes } from './contactsRouter.js';

const router: Router = Router();
registerContactsRoutes(router);
export default router;
