/**
 * conversationMemory.ts — memory/buffer management for contextManager.
 *
 * Moved from contextManager.ts.
 * Wraps the existing memoryService.ts (which is already a separate file in modules/ai/).
 *
 * Public exports:
 *   loadMemory()        — from memoryService
 *   formatMemoryContext() — from memoryService
 *   trimMessageHistory()  — token-aware history trimming
 */

export { loadMemory, formatMemoryContext } from '../memoryService.js';

export type { MemoryEntry, MemorySummary } from '../memoryService.js';
