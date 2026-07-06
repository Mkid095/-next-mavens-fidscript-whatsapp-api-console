/**
 * contextUtils.ts — thin re-export layer for the LLM config system.
 *
 * Re-exports from:
 *   llmConfigResolution.ts — config resolution logic
 *   contextTypes.ts         — shared types
 */

export {
  resolveLLMConfig,
  loadFallbackChain,
} from './llmConfigResolution.js';

export type {
  ResolvedLLMConfig,
  FallbackEntry,
} from './contextTypes.js';
