/**
 * validationAggregator.ts — validatePublish aggregator + helpers.
 */
import type { ChatbotDraft } from '../../types/chatbotDraft.js';
import type { ValidationError, ValidationWarning, ValidationResult } from './validationHandlers.js';
import { validateGeneral, validateAudience, validateAI, validateKnowledge, validateTools, validateHandoff } from './validationHandlers.js';

export function merge(...results: ValidationResult[]): ValidationResult {
  return { valid: results.every(r => r.valid), errors: results.flatMap(r => r.errors), warnings: results.flatMap(r => r.warnings) };
}

export function validatePublish(draft: ChatbotDraft): ValidationResult {
  const hasTriggers = (draft.handoff.triggers ?? []).length > 0;
  const stepResults = [
    validateGeneral(draft), validateAudience(draft), validateAI(draft),
    validateKnowledge(draft), validateTools(draft), validateHandoff(draft),
  ];
  const errors = stepResults.flatMap(r => r.errors);
  const warnings = stepResults.flatMap(r => r.warnings);
  if (!hasTriggers) {
    warnings.push({ step: 'handoff', field: 'triggers', message: 'No handoff triggers set — the bot will not automatically escalate to a human. Consider adding triggers.' });
  }
  return { valid: errors.length === 0, errors, warnings };
}
