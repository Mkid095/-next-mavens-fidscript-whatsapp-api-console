import { Router } from 'express';
import { analyticsRouter, logsRouter, instancesRouter, messagesRouter, maintenanceRouter, webhookTestRouter } from './admin/index.js';

const router = Router();
router.use('/', instancesRouter);
router.use('/', analyticsRouter);
router.use('/', logsRouter);
router.use('/', messagesRouter);
router.use('/', maintenanceRouter);
router.use('/', webhookTestRouter);

export default router;