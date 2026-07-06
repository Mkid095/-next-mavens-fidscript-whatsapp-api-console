/**
 * Conversations Router — Express router with all route registrations.
 * All handler logic is delegated to focused modules imported from conversationHandlers.js.
 */

import { Router } from 'express';
import { clientJwtAuth } from '../../../middleware/auth.js';
import { workspaceAuth } from '../../../modules/platform/workspace/context.js';
import {
  listConversations,
  getConversationMessages,
  getConversationTraces,
  getPromptSnapshot,
  updateConversation,
  takeoverByChatId,
  takeoverById,
  resumeAiByChatId,
  resumeAiById,
  assignConversation,
  transferConversation,
  releaseConversation,
  getAiOverride,
  getAiMetadata,
} from '../conversationHandlers.js';

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
