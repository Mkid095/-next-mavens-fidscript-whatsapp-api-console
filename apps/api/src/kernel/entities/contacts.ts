import db from '../../database.js';
// TODO: Phase 4 — identity — WorkspaceContext lives in modules/platform/workspace/index.ts
import type { WorkspaceContext } from '../../modules/platform/workspace/index.js';

// =============================================================================
// getCustomer — workspace-scoped customer lookup.
// =============================================================================

interface CustomerRow { id: string; display_name: string | null }

export function getCustomer(
  ctx: WorkspaceContext,
  customerId: string,
): CustomerRow | null {
  const row = db.prepare(
    'SELECT * FROM customers WHERE id = ? AND workspace_id = ?',
  ).get(customerId, ctx.workspaceId);
  return (row as CustomerRow | undefined) ?? null;
}

// =============================================================================
// getConversation — workspace-scoped conversation lookup.
// =============================================================================

interface ConversationRow { id: string }

export function getConversation(
  ctx: WorkspaceContext,
  conversationId: string,
): ConversationRow | null {
  const row = db.prepare(
    'SELECT * FROM conversations WHERE id = ? AND workspace_id = ?',
  ).get(conversationId, ctx.workspaceId);
  return (row as ConversationRow | undefined) ?? null;
}
