// Type declarations for engine.js
import type { Flow } from './types.js';
import type { WorkspaceContext } from '../platform/workspace/index.js';
export declare function runFlow(ctx: WorkspaceContext, flow: Flow, payload: Record<string, unknown>, execId: string): Promise<void>;
