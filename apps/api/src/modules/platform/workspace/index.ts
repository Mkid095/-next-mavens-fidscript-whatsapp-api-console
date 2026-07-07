// Platform Workspace module — forwarding re-exports from kernel/identity.
// context.ts + scope.ts + can.ts live in kernel/identity/ now.
export { createWorkspaceTables, seedWorkspaceData } from './tables.js';
export { runWorkspaceMigrations } from './migrations.js';
export { can, loadUserWorkspacePerms, invalidatePermCache } from '../../../kernel/identity/can.js';
export type { WorkspaceContext, AuthenticatedRequest } from '../../../kernel/identity/context.js';
export { workspaceAuth, requirePerm } from '../../../kernel/identity/context.js';
export { whereWorkspace, workspaceFilter } from '../../../kernel/identity/scope.js';
