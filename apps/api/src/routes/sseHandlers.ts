/**
 * sseHandlers.ts — SSE route handlers barrel
 *
 * Split into:
 * - sseHandlers.ts              → thin barrel
 * - sseShared.ts                → setSseHeaders + heartbeat helpers
 * - sseAuth.ts                  → authSseToken helper
 * - sseDashboardStats.ts       → dashboard SQL + payload builder
 * - sseInstanceHandler.ts       → handleInstanceSse
 * - sseClientHandler.ts         → handleClientSse
 * - sseConnectionHandlers.ts    → dashboard + refresh + publish jobs
 */
export { setSseHeaders, heartbeat } from './sseShared.js';
export { authSseToken } from './sseAuth.js';
export { handleInstanceSse } from './sseInstanceHandler.js';
export { handleClientSse } from './sseClientHandler.js';
export {
  handleDashboardSse,
  handleDashboardRefresh,
} from './sseConnectionHandlers.js';
