import { Router } from 'express';
import { analyticsRouter, logsRouter, instancesRouter, messagesRouter, maintenanceRouter, webhookTestRouter, llmProvidersRouter, chatbotAnalyticsRouter } from './admin/index.js';
import execRouter from './admin/exec.js';

const router = Router();
router.use('/', instancesRouter);
router.use('/', analyticsRouter);
router.use('/', logsRouter);
router.use('/', messagesRouter);
router.use('/', maintenanceRouter);
router.use('/', webhookTestRouter);
router.use('/', llmProvidersRouter);
router.use('/', chatbotAnalyticsRouter);
router.use('/', execRouter);

export default router;