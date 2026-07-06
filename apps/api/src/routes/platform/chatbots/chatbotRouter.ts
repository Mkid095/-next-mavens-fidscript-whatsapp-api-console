/**
 * Chatbot Router — Express router with all route registrations.
 * All handler logic is delegated to focused modules imported from chatbotHandlers.js.
 */

import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../../middleware/auth.js';
import {
  listChatbots,
  getChatbot,
  createChatbot,
  updateChatbot,
  deleteChatbot,
  toggleChatbot,
  updateAiConfig,
  createTrigger,
  deleteTrigger,
  createRule,
  updateRule,
  deleteRule,
  createHandoffRule,
  updatePolicies,
  saveGroupSettings,
  assignContact,
  unassignContact,
  testTrigger,
  publishChatbot,
  getPublishJob,
  healthCheck,
  testConfig,
  getVersions,
  rollbackChatbot,
  duplicateChatbot,
  tokenForecast,
  getTools,
  attachTools,
  detachTool,
  getInspectorConversations,
  replayChatbot,
} from '../chatbotHandlers.js';

const router = Router();
router.use(clientJwtAuth);

router.get('/', listChatbots);
router.get('/:id', getChatbot);
router.post('/', createChatbot);
router.put('/:id', updateChatbot);
router.delete('/:id', deleteChatbot);
router.patch('/:id/toggle', toggleChatbot);

router.put('/:id/ai-config', updateAiConfig);

router.post('/:id/triggers', createTrigger);
router.delete('/:id/triggers/:triggerId', deleteTrigger);

router.post('/:id/rules', createRule);
router.put('/:id/rules/:ruleId', updateRule);
router.delete('/:id/rules/:ruleId', deleteRule);

router.post('/:id/handoff-rules', createHandoffRule);

router.put('/:id/policies', updatePolicies);

router.post('/:id/group-settings', saveGroupSettings);

router.post('/:id/contacts/:contactId', assignContact);
router.delete('/:id/contacts/:contactId', unassignContact);

router.post('/:id/test-trigger', testTrigger);

router.post('/:id/publish', publishChatbot);
router.get('/:id/publish-job', getPublishJob);

router.get('/:id/health', healthCheck);
router.post('/:id/test-config', testConfig);
router.get('/:id/versions', getVersions);
router.post('/:id/rollback', rollbackChatbot);
router.post('/:id/duplicate', duplicateChatbot);
router.get('/:id/token-forecast', tokenForecast);

router.get('/:id/tools', getTools);
router.post('/:id/tools', attachTools);
router.delete('/:id/tools/:toolId', detachTool);

router.get('/:id/conversations', getInspectorConversations);
router.post('/:id/replay', replayChatbot);

export default router;
