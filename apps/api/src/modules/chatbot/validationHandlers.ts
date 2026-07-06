/**
 * validationHandlers.ts — Step validators (general, audience, AI, knowledge, tools, handoff).
 */
import type { ChatbotDraft } from '../../types/chatbotDraft.js';

export interface ValidationError { step: string; field: string; message: string; }
export interface ValidationWarning { step: string; field: string; message: string; }
export interface ValidationResult { valid: boolean; errors: ValidationError[]; warnings: ValidationWarning[]; }

export function validateGeneral(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { name, description, template, priority } = draft.general;

  if (!name?.trim()) {
    errors.push({ step: 'general', field: 'name', message: 'Chatbot name is required' });
  } else if (name.trim().length < 2) {
    errors.push({ step: 'general', field: 'name', message: 'Chatbot name must be at least 2 characters' });
  } else if (name.trim().length > 80) {
    errors.push({ step: 'general', field: 'name', message: 'Chatbot name must be 80 characters or fewer' });
  }
  if (description.length > 500) errors.push({ step: 'general', field: 'description', message: 'Description must be 500 characters or fewer' });
  if (priority < 0 || priority > 100) errors.push({ step: 'general', field: 'priority', message: 'Priority must be between 0 and 100' });
  if (!template) errors.push({ step: 'general', field: 'template', message: 'Please select a template' });
  if (name && name.length < 5) warnings.push({ step: 'general', field: 'name', message: 'A more descriptive name helps identify this bot' });
  if (!description.trim()) warnings.push({ step: 'general', field: 'description', message: 'Adding a description helps your team understand this bot\'s purpose' });
  return { valid: errors.length === 0, errors, warnings };
}

export function validateAudience(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { contactMode, tags, contactIds } = draft.audience;

  if (['tagged-contacts'].includes(contactMode) && (!tags || tags.length === 0)) {
    errors.push({ step: 'audience', field: 'tags', message: 'At least one tag is required for tagged-contact mode' });
  }
  if (['specific-contacts', 'whitelist', 'blacklist'].includes(contactMode) && (!contactIds || contactIds.length === 0)) {
    errors.push({ step: 'audience', field: 'contactIds', message: 'At least one contact is required for this mode' });
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validateAI(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { provider, model, systemPrompt, llmConnectionId } = draft.aiBrain;

  if (!provider || !['fidscript', 'openai', 'anthropic', 'gemini', 'openrouter', 'ollama', 'custom'].includes(provider)) {
    errors.push({ step: 'ai-brain', field: 'provider', message: 'Please select a valid AI provider' });
  }
  if (!model?.trim()) errors.push({ step: 'ai-brain', field: 'model', message: 'Model name is required' });
  if (['custom', 'openrouter', 'ollama'].includes(provider) && !llmConnectionId && !draft.aiBrain.apiKey && !draft.aiBrain.baseUrl) {
    warnings.push({ step: 'ai-brain', field: 'apiKey', message: 'No API key or connection configured — AI responses will use the workspace default' });
  }
  if (systemPrompt.length > 32000) errors.push({ step: 'ai-brain', field: 'systemPrompt', message: 'System prompt exceeds 32,000 character limit' });
  return { valid: errors.length === 0, errors, warnings };
}

export function validateKnowledge(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { sources } = draft.knowledge;

  for (const src of sources) {
    if (src.status === 'error') errors.push({ step: 'knowledge', field: `source:${src.name}`, message: `Knowledge source "${src.name}" is in an error state — fix or remove it before publishing` });
    if (!src.name?.trim()) errors.push({ step: 'knowledge', field: 'name', message: 'All knowledge sources must have a name' });
  }
  if (sources.length > 0 && sources.filter(s => s.status === 'active').length === 0) {
    warnings.push({ step: 'knowledge', field: 'sources', message: 'No knowledge sources are active — the bot will rely only on its AI model\'s training data' });
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validateTools(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { tools } = draft.tools;

  for (const tool of tools) {
    if (!tool.name?.trim()) errors.push({ step: 'tools', field: 'name', message: 'All tools must have a name' });
    if (!tool.type) errors.push({ step: 'tools', field: 'type', message: `Tool "${tool.name || 'unnamed'}" must have a type` });
    if ((tool.type === 'http-request' || tool.type === 'webhook') && tool.config) {
      const url = (tool.config as Record<string, unknown>).url as string | undefined;
      if (url && !url.startsWith('http')) errors.push({ step: 'tools', field: 'config.url', message: `Tool "${tool.name}" has an invalid URL — must start with http:// or https://` });
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validateHandoff(draft: ChatbotDraft): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const { triggers, targetTeamId, fallbackReply } = draft.handoff;

  if (triggers?.length > 0 && !targetTeamId?.trim()) {
    errors.push({ step: 'handoff', field: 'targetTeamId', message: 'At least one handoff trigger is set, but no escalation team is configured' });
  }
  if (fallbackReply && fallbackReply.length > 500) errors.push({ step: 'handoff', field: 'fallbackReply', message: 'Fallback reply must be 500 characters or fewer' });
  return { valid: errors.length === 0, errors, warnings };
}
