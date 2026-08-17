/**
 * Conversations route registrations - delegates to handlers in conversationsHandlers.ts.
 */
import { Router } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import { workspaceAuth } from '../../modules/platform/workspace/context.js';
import {
  handleListConversations, handleGetMessages,
  handlePatchConversation,
  handleAssignConversation, handleTransferConversation, handleReleaseConversation,
} from './conversationsHandlers.js';

export function registerConversationRoutes(router: Router): void {
  router.use(clientJwtAuth);
  router.use(workspaceAuth);

  router.get('/', handleListConversations);
  router.get('/:id/messages', handleGetMessages);
  router.patch('/:id', handlePatchConversation);
  router.post('/:id/assign', handleAssignConversation);
  router.post('/:id/transfer', handleTransferConversation);
  router.post('/:id/release', handleReleaseConversation);
}
