// Type declarations for conditionEvaluator.js
import type { TriggerNodeConfig, ConditionNodeConfig } from './types.js';
export function evalCondition(cfg: ConditionNodeConfig, payload: Record<string, unknown>): boolean;
export function triggerMatches(cfg: TriggerNodeConfig, payload: Record<string, unknown>): boolean;
