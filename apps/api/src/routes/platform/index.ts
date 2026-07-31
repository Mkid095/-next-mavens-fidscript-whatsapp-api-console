import { Router } from 'express';
import customersRoutes from './customers.js';
import customerDetailsRoutes from './customerDetails.js';
import conversationsRoutes from './conversations.js';
import searchRoutes from './search.js';
import analyticsRoutes from './analytics.js';
import groupsRoutes from './groups.js';
import teamsRoutes from './teams.js';
import slaRoutes from './sla.js';
import mediaRoutes from './media.js';
import segmentsRoutes from './segments.js';
import webhooksRoutes from './webhooks.js';
import auditRoutes from './audit.js';
import developerLogsRoutes from './developerLogs.js';
import chatMirrorRoutes from './chatMirror/index.js';
import phonebookRoutes from './phonebook.js';
import { workspaceAuth } from '../../modules/platform/workspace/index.js';
import { clientJwtAuth } from '../../middleware/auth.js';

const router = Router();
router.use(clientJwtAuth, workspaceAuth);

router.use('/customers', customersRoutes);
router.use('/customers', customerDetailsRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/search', searchRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/groups', groupsRoutes);
router.use('/teams', teamsRoutes);
router.use('/sla-policies', slaRoutes);
router.use('/media', mediaRoutes);
router.use('/segments', segmentsRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/audit', auditRoutes);
router.use('/developer-logs', developerLogsRoutes);
router.use('/', chatMirrorRoutes);
router.use('/phonebook', phonebookRoutes);

export default router;
