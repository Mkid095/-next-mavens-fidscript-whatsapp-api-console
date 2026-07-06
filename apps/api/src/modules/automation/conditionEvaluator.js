// Condition matching logic — shared by engine and rulesHandlers.
import type { TriggerNodeConfig, ConditionNodeConfig } from './index.js';

export function evalCondition(cfg: ConditionNodeConfig, payload: Record<string, unknown>): boolean {
  const fieldVal = String(payload[cfg.field] ?? '');
  const target = String(cfg.value ?? '');
  switch (cfg.op) {
    case 'equals': return fieldVal === target;
    case 'contains': return fieldVal.toLowerCase().includes(target.toLowerCase());
    case 'starts_with': return fieldVal.toLowerCase().startsWith(target.toLowerCase());
    case 'regex': {
      try { return new RegExp(target, 'i').test(fieldVal); } catch { return false; }
    }
  }
}

export function triggerMatches(cfg: TriggerNodeConfig, payload: Record<string, unknown>): boolean {
  if (cfg.field && cfg.value && cfg.op) {
    return evalCondition({ field: cfg.field, op: cfg.op, value: cfg.value }, payload);
  }
  return true;
}
