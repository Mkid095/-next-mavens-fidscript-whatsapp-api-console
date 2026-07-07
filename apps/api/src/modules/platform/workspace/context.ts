// Forwarding re-export from canonical kernel/identity location.
// context.ts + scope.ts + can.ts live in kernel/identity/ now.
export { workspaceAuth, requirePerm } from '../../../kernel/identity/context.js';
export type { WorkspaceContext, AuthenticatedRequest } from '../../../kernel/identity/context.js';
