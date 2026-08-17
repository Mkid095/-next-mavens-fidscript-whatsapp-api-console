// Kernel Identity module - public barrel
export { workspaceAuth, requirePerm } from './context.js';
export type { WorkspaceContext, AuthenticatedRequest } from './context.js';
export { can, loadUserWorkspacePerms, invalidatePermCache } from './can.js';
export { whereWorkspace, workspaceFilter } from './scope.js';
