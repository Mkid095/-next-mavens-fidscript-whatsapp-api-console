// Kernel Audit module - public barrel
export { logAuditAction, logStateTransition, logApiRequest, responseTimeMiddleware, latencyMs } from './writer.js';
export { registerAuditTrail } from './trail.js';
export type { AuditAction } from './writer.js';
