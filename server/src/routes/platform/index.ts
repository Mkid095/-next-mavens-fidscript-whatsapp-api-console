import { Router } from 'express';
import customersRoutes from './customers.js';
import conversationsRoutes from './conversations.js';
import searchRoutes from './search.js';
import analyticsRoutes from './analytics.js';

// Platform API — customer-centric reads + operational writes.
// All routes use clientJwtAuth (workspace-scoped via req.client.id).
const router = Router();

router.use('/customers', customersRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/search', searchRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
