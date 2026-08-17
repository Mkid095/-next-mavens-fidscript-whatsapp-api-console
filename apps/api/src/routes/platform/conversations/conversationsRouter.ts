/**
 * Conversations Router - Express router with all route registrations.
 * All handler logic is delegated to focused modules imported from conversationHandlers.js.
 */

import { Router } from 'express';
import { clientJwtAuth } from '../../../middleware/auth.js';
import { workspaceAuth } from '../../../modules/platform/workspace/context.js';
import {
  listConversations,
  getConversationMessages,
  updateConversation,
  assignConversation,
  transferConversation,
  releaseConversation,
} from '../conversationHandlers.js';

const router = Router();
router.use(clientJwtAuth);
router.use(workspaceAuth);

router.get('/', listConversations);
router.get('/:id/messages', getConversationMessages);
router.patch('/:id', updateConversation);

router.post('/:id/assign', assignConversation);
router.post('/:id/transfer', transferConversation);
router.post('/:id/release', releaseConversation);

export default router;
