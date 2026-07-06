/**
 * Conversations route registrations — delegates to handlers in conversationsHandlers.ts.
 */
import { Router } from 'express';
import { clientJwtAuth } from '@/routes/middleware/auth';
import { workspaceAuth } from '@/routes/modules/platform/workspace/context';
import {
  handleListConversations, handleGetMessages, handleGetTraces,
  handleGetPromptSnapshot, handlePatchConversation,
  handleGetOverride, handlePostTakeoverByJid, handlePostTakeoverById,
  handleResumeAiByJid, handleResumeAiById,
  handleAssignConversation, handleTransferConversation, handleReleaseConversation,
  handleGetAiMetadata,
} from './conversationsHandlers';

export function registerConversationRoutes(router: Router): void {
  router.use(clientJwtAuth);
  router.use(workspaceAuth);

  router.get('/', handleListConversations);
  router.get('/:id/messages', handleGetMessages);
  router.get('/:id/traces', handleGetTraces);
  router.get('/messages/:id/prompt-snapshot', handleGetPromptSnapshot);
  router.patch('/:id', handlePatchConversation);
  router.get('/override/:chatId', handleGetOverride);
  router.post('/takeover/:chatId', handlePostTakeoverByJid);
  router.post('/:id/takeover', handlePostTakeoverById);
  router.post('/resume-ai/:chatId', handleResumeAiByJid);
  router.post('/:id/resume-ai', handleResumeAiById);
  router.post('/:id/assign', handleAssignConversation);
  router.post('/:id/transfer', handleTransferConversation);
  router.post('/:id/release', handleReleaseConversation);
  router.get('/messages/:messageId/ai-metadata', handleGetAiMetadata);
}
