/**
 * contextManager.ts — thin re-export barrel.
 *
 * All logic moved to contextManager/:
 *   contextManagerImpl.ts   — LLM config resolution + context building
 *   conversationMemory.ts   — memory/buffer management
 */
export type {
  ResolvedLLMConfig,
  FallbackEntry,
  BuildContextOptions,
  BuiltContext,
  TokenBudget,
} from './contextManager/index.js';

export {
  resolveLLMConfig,
  loadFallbackChain,
  buildContext,
  trimMessageHistory,
} from './contextManager/index.js';

export {
  loadMemory,
  formatMemoryContext,
} from './contextManager/index.js';
