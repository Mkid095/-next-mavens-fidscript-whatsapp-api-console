/**
 * contextManager/ — LLM-ready context builder.
 *
 * Thin barrel re-exporting from contextManagerImpl.ts and conversationMemory.ts.
 */
export type {
  ResolvedLLMConfig,
  FallbackEntry,
  BuildContextOptions,
  BuiltContext,
  TokenBudget,
} from './contextManagerImpl.js';

export {
  resolveLLMConfig,
  loadFallbackChain,
  buildContext,
  trimMessageHistory,
} from './contextManagerImpl.js';

export {
  loadMemory,
  formatMemoryContext,
} from './conversationMemory.js';
