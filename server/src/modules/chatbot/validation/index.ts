/**
 * Chatbot Validation Engine
 *
 * Pure validation functions — no I/O, no side effects.
 * Each function returns errors and warnings for its step.
 * validatePublish() aggregates all steps.
 */

import type { ChatbotDraft } from '../../../types/chatbotDraft.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationError {
  step: string;
  field: string;
  message: string;
}

export interface ValidationWarning {
  step: string;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

function ok(): ValidationResult {
  return { valid: true, errors: [], warnings: [] };
}

function merge(...results: ValidationResult[]): ValidationResult {
  return {
    valid: results.every(r => r.valid),
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings),
  };
}

// ─── Per-step validators ───────────────────────────────────────────────────────

export function validateGeneral(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { name, description, template, priority } = draft.general;

  if (!name || !name.trim()) {
    errors.push({ step: 'general', field: 'name', message: 'Chatbot name is required' });
  } else if (name.trim().length < 2) {
    errors.push({ step: 'general', field: 'name', message: 'Chatbot name must be at least 2 characters' });
  } else if (name.trim().length > 80) {
    errors.push({ step: 'general', field: 'name', message: 'Chatbot name must be 80 characters or fewer' });
  }

  if (description.length > 500) {
    errors.push({ step: 'general', field: 'description', message: 'Description must be 500 characters or fewer' });
  }

  if (priority < 0 || priority > 100) {
    errors.push({ step: 'general', field: 'priority', message: 'Priority must be between 0 and 100' });
  }

  if (!template) {
    errors.push({ step: 'general', field: 'template', message: 'Please select a template' });
  }

  // Warnings
  if (name && name.length < 5) {
    warnings.push({ step: 'general', field: 'name', message: 'A more descriptive name helps identify this bot' });
  }
  if (!description.trim()) {
    warnings.push({ step: 'general', field: 'description', message: 'Adding a description helps your team understand this bot\'s purpose' });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateAudience(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { contactMode, tags, contactIds } = draft.audience;

  const modesRequiringTags = ['tagged-contacts'];
  if (modesRequiringTags.includes(contactMode) && (!tags || tags.length === 0)) {
    errors.push({ step: 'audience', field: 'tags', message: 'At least one tag is required for tagged-contact mode' });
  }

  const modesRequiringContacts = ['specific-contacts', 'whitelist', 'blacklist'];
  if (modesRequiringContacts.includes(contactMode) && (!contactIds || contactIds.length === 0)) {
    errors.push({ step: 'audience', field: 'contactIds', message: 'At least one contact is required for this mode' });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateAI(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { provider, model, systemPrompt, llmConnectionId } = draft.aiBrain;

  const validProviders = ['fidscript', 'openai', 'anthropic', 'gemini', 'openrouter', 'ollama', 'custom'];
  if (!provider || !validProviders.includes(provider)) {
    errors.push({ step: 'ai-brain', field: 'provider', message: 'Please select a valid AI provider' });
  }

  if (!model || !model.trim()) {
    errors.push({ step: 'ai-brain', field: 'model', message: 'Model name is required' });
  }

  // BYOLLM providers (custom, openrouter, etc.) need either a connection or direct config
  const needsDirectConfig = ['custom', 'openrouter', 'ollama'].includes(provider);
  if (needsDirectConfig && !llmConnectionId && !draft.aiBrain.apiKey && !draft.aiBrain.baseUrl) {
    warnings.push({
      step: 'ai-brain',
      field: 'apiKey',
      message: 'No API key or connection configured — AI responses will use the workspace default',
    });
  }

  if (systemPrompt.length > 32000) {
    errors.push({ step: 'ai-brain', field: 'systemPrompt', message: 'System prompt exceeds 32,000 character limit' });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateKnowledge(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { sources } = draft.knowledge;

  for (const src of sources) {
    if (src.status === 'error') {
      errors.push({
        step: 'knowledge',
        field: `source:${src.name}`,
        message: `Knowledge source "${src.name}" is in an error state — fix or remove it before publishing`,
      });
    }
    if (!src.name || !src.name.trim()) {
      errors.push({ step: 'knowledge', field: 'name', message: 'All knowledge sources must have a name' });
    }
  }

  const activeSources = sources.filter(s => s.status === 'active');
  if (sources.length > 0 && activeSources.length === 0) {
    warnings.push({
      step: 'knowledge',
      field: 'sources',
      message: 'No knowledge sources are active — the bot will rely only on its AI model\'s training data',
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateTools(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { tools } = draft.tools;

  for (const tool of tools) {
    if (!tool.name || !tool.name.trim()) {
      errors.push({ step: 'tools', field: 'name', message: 'All tools must have a name' });
    }
    if (!tool.type) {
      errors.push({ step: 'tools', field: 'type', message: `Tool "${tool.name || 'unnamed'}" must have a type` });
    }
    // Validate URL for webhook/http-request types
    if ((tool.type === 'http-request' || tool.type === 'webhook') && tool.config) {
      const url = (tool.config as Record<string, unknown>).url as string | undefined;
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        errors.push({
          step: 'tools',
          field: 'config.url',
          message: `Tool "${tool.name}" has an invalid URL — must start with http:// or https://`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateHandoff(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { triggers, targetTeamId, fallbackReply } = draft.handoff;

  if (triggers && triggers.length > 0) {
    if (!targetTeamId || !targetTeamId.trim()) {
      errors.push({
        step: 'handoff',
        field: 'targetTeamId',
        message: 'At least one handoff trigger is set, but no escalation team is configured',
      });
    }
  }

  if (fallbackReply && fallbackReply.length > 500) {
    errors.push({ step: 'handoff', field: 'fallbackReply', message: 'Fallback reply must be 500 characters or fewer' });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validatePublish(draft: ChatbotDraft): ValidationResult {
  // Gate: at least one trigger must be defined (handoff triggers count)
  const hasTriggers = (draft.handoff.triggers ?? []).length > 0;

  const stepResults = [
    validateGeneral(draft),
    validateAudience(draft),
    validateAI(draft),
    validateKnowledge(draft),
    validateTools(draft),
    validateHandoff(draft),
  ];

  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const result of stepResults) {
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Publish-level gate: at least one trigger
  if (!hasTriggers) {
    errors.push({
      step: 'handoff',
      field: 'triggers',
      message: 'At least one trigger is required — add a handoff trigger or enable a knowledge source with auto-trigger',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
