/**
 * Chatbot route registrations — delegates to handlers in chatbotHandlers.ts.
 */
import { Router } from 'express';
import { clientJwtAuth } from '@/routes/middleware/auth';
import db from '@/routes/database';
import {
  handleListChatbots, handleGetChatbot, handleCreateChatbot,
  handleUpdateChatbot, handleDeleteChatbot, handleToggleChatbot,
  handleAiConfig, handleTriggers, handleDeleteTrigger,
  handleRules, handleUpdateRule, handleDeleteRule,
  handleHandoffRules, handlePolicies, handleGroupSettings,
  handleAssignContact, handleUnassignContact, handleTestTrigger,
  handlePublish, handleGetPublishJob, handleHealth,
  handleTestConfig, handleVersions, handleRollback,
  handleDuplicate, handleTokenForecast, handleTraces,
  handleTools, handleAttachTools, handleDetachTool,
  handleConversations, handleReplay,
} from './chatbotHandlers';

export function registerChatbotRoutes(router: Router): void {
  router.use(clientJwtAuth);

  router.get('/', handleListChatbots);
  router.get('/:id', handleGetChatbot);
  router.post('/', handleCreateChatbot);
  router.put('/:id', handleUpdateChatbot);
  router.delete('/:id', handleDeleteChatbot);
  router.patch('/:id/toggle', handleToggleChatbot);
  router.put('/:id/ai-config', handleAiConfig);
  router.post('/:id/triggers', handleTriggers);
  router.delete('/:id/triggers/:triggerId', handleDeleteTrigger);
  router.post('/:id/rules', handleRules);
  router.put('/:id/rules/:ruleId', handleUpdateRule);
  router.delete('/:id/rules/:ruleId', handleDeleteRule);
  router.post('/:id/handoff-rules', handleHandoffRules);
  router.put('/:id/policies', handlePolicies);
  router.post('/:id/group-settings', handleGroupSettings);
  router.post('/:id/contacts/:contactId', handleAssignContact);
  router.delete('/:id/contacts/:contactId', handleUnassignContact);
  router.post('/:id/test-trigger', handleTestTrigger);
  router.post('/:id/publish', handlePublish);
  router.get('/:id/publish-job', handleGetPublishJob);
  router.get('/:id/health', handleHealth);
  router.post('/:id/test-config', handleTestConfig);
  router.get('/:id/versions', handleVersions);
  router.post('/:id/rollback', handleRollback);
  router.post('/:id/duplicate', handleDuplicate);
  router.get('/:id/token-forecast', handleTokenForecast);
  router.get('/:id/traces', handleTraces);
  router.get('/:id/tools', handleTools);
  router.post('/:id/tools', handleAttachTools);
  router.delete('/:id/tools/:toolId', handleDetachTool);
  router.get('/:id/conversations', handleConversations);
  router.post('/:id/replay', handleReplay);
}
