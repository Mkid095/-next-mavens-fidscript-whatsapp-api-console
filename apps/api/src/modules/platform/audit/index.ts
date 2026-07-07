// Platform Audit module — forwarding re-export from canonical kernel location.
// All audit logic lives in kernel/audit/.
export { logAuditAction, logStateTransition, logApiRequest } from '../../../kernel/audit/index.js';
export { registerAuditTrail } from '../../../kernel/audit/index.js';
export type { AuditAction } from '../../../kernel/audit/index.js';
