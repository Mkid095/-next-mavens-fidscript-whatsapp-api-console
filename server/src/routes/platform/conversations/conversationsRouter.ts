/**
 * Conversations Router — Express router with all route registrations.
 * All handler logic is delegated to focused modules imported from conversationHandlers.js.
 */

import { Router } from 'express';
import { clientJwtAuth } from '@/routes/platform/middleware/auth';
import { workspaceAuth } from '@/routes/platform/modules/platform/workspace/context';
import {
  handleListConversations as listConversations,
  handleGetConversationMessages as getConversationMessages,
  handleGetConversationTraces as getConversationTraces,
  handleGetPromptSnapshot as getPromptSnapshot,
  handleUpdateConversation as updateConversation,
  handleTakeoverByChatId as takeoverByChatId,
  handleTakeoverById as takeoverById,
  handleResumeAiByChatId as resumeAiByChatId,
  handleResumeAiById as resumeAiById,
  handleAssignConversation as assignConversation,
  handleTransferConversation as transferConversation,
  handleReleaseConversation as releaseConversation,
  handleGetAiOverride as getAiOverride,
  handleGetAiMetadata as getAiMetadata,
} from '@/routes/platform/conversations/conversationHandlers';

const router = Router();
router.use(clientJwtAuth);
router.use(workspaceAuth);

router.get('/', listConversations);
router.get('/:id/messages', getConversationMessages);
router.get('/:id/traces', getConversationTraces);
router.get('/messages/:id/prompt-snapshot', getPromptSnapshot);
router.patch('/:id', updateConversation);

router.get('/override/:chatId', getAiOverride);
router.post('/takeover/:chatId', takeoverByChatId);
router.post('/:id/takeover', takeoverById);
router.post('/resume-ai/:chatId', resumeAiByChatId);
router.post('/:id/resume-ai', resumeAiById);

router.post('/:id/assign', assignConversation);
router.post('/:id/transfer', transferConversation);
router.post('/:id/release', releaseConversation);

router.get('/messages/:messageId/ai-metadata', getAiMetadata);

export default router;
