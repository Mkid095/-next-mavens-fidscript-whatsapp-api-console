import { Router } from 'express';
import { analyticsRouter, logsRouter, instancesRouter } from './admin/index.js';

const router = Router();
router.use('/', instancesRouter);
router.use('/', analyticsRouter);
router.use('/', logsRouter);

export default router;