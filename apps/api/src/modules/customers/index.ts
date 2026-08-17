// Customers module - re-exports from the canonical kernel/entities location.
// All conversation + contact resolution lives in kernel/entities/.
export { resolveConversation, getCustomer, getConversation } from '../../kernel/entities/index.js';
export type { ResolveResult } from '../../kernel/entities/index.js';
