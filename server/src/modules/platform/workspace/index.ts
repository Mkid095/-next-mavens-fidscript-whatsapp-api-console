// Platform Workspace module — public barrel
export { createWorkspaceTables, seedWorkspaceData } from './tables.js';
export { runWorkspaceMigrations } from './migrations.js';
export { can, loadUserWorkspacePerms, invalidatePermCache } from './can.js';
export type { WorkspaceContext, AuthenticatedRequest } from './context.js';
export { workspaceAuth, requirePerm } from './context.js';
