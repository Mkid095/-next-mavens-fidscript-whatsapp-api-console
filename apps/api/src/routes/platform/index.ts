import { Router } from 'express';
import customersRoutes from './customers.js';
import customerDetailsRoutes from './customerDetails.js';
import conversationsRoutes from './conversations.js';
import searchRoutes from './search.js';
import analyticsRoutes from './analytics.js';
import groupsRoutes from './groups.js';
import teamsRoutes from './teams.js';
import slaRoutes from './sla.js';
import agentsRoutes from './agents/index.js';
import automationRulesRoutes from './automationRules.js';
import automationsRoutes from './automations/index.js';
import chatbotsRoutes from './chatbots/index.js';
import chatbotDraftsRoutes from './chatbotDrafts/index.js';
import llmConnectionsRoutes from './llmConnections.js';
import mediaRoutes from './media.js';
import segmentsRoutes from './segments.js';
import webhooksRoutes from './webhooks.js';
import auditRoutes from './audit.js';
import developerLogsRoutes from './developerLogs.js';
import chatMirrorRoutes from './chatMirror.js';
import phonebookRoutes from './phonebook.js';
import dataSourcesRoutes from './dataSources.js';
import connectorsRoutes from './connectors.js';
import { workspaceAuth } from '../../modules/platform/workspace/index.js';
import { clientJwtAuth } from '../../middleware/auth.js';

// Platform API — customer-centric reads + operational writes.
// Workspace-scoped (P11): every request binds req.workspace.workspaceId.
//   - clientJwtAuth: canonical auth path — populates req.client (workspace = client)
//   - workspaceAuth: sets req.workspace + req.can() for downstream queries
// The two-layer pattern means helpers like whereWorkspace(req) work regardless
// of which middleware a sub-router applied.
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
router.use('/agents', agentsRoutes);
router.use('/automation-rules', automationRulesRoutes);
router.use('/automations', automationsRoutes);
router.use('/chatbots', chatbotsRoutes);
router.use('/chatbot-drafts', chatbotDraftsRoutes);
router.use('/llm-connections', llmConnectionsRoutes);
router.use('/data-sources', dataSourcesRoutes);
router.use('/connectors', connectorsRoutes);
router.use('/media', mediaRoutes);
router.use('/segments', segmentsRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/audit', auditRoutes);
router.use('/developer-logs', developerLogsRoutes);
router.use('/', chatMirrorRoutes);
router.use('/phonebook', phonebookRoutes);

export default router;
