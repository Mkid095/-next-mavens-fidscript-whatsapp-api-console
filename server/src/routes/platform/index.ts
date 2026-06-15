import { Router } from 'express';
import customersRoutes from './customers.js';
import customerDetailsRoutes from './customerDetails.js';
import conversationsRoutes from './conversations.js';
import searchRoutes from './search.js';
import analyticsRoutes from './analytics.js';
import groupsRoutes from './groups.js';
import teamsRoutes from './teams.js';
import slaRoutes from './sla.js';

// Platform API — customer-centric reads + operational writes.
// All routes use clientJwtAuth (workspace-scoped via req.client.id).
const router = Router();

router.use('/customers', customersRoutes);
router.use('/customers', customerDetailsRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/search', searchRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/groups', groupsRoutes);
router.use('/teams', teamsRoutes);
router.use('/sla-policies', slaRoutes);

export default router;
