/**
 * Fidscript Conversation Automation Platform
 * Chatbot Builder — Step / builder-flow types
 */

export const BUILDER_STEPS = [
  { id: 'general',           label: 'General',            description: 'Name, description & template' },
  { id: 'audience',          label: 'Audience',           description: 'Who should this bot talk to?' },
  { id: 'ai-brain',          label: 'AI Brain',           description: 'Provider, model & memory' },
  { id: 'knowledge',         label: 'Knowledge',          description: 'What information does it know?' },
  { id: 'data-connections',  label: 'Data Connections',  description: 'Databases & API integrations' },
  { id: 'tools',             label: 'Tools',              description: 'Actions the bot can perform' },
  { id: 'groups',            label: 'Groups',             description: 'WhatsApp group behavior' },
  { id: 'handoff',           label: 'Human Handoff',      description: 'When to transfer to humans' },
  { id: 'test',              label: 'Test',               description: 'Simulate conversations' },
  { id: 'analytics',         label: 'Analytics',          description: 'Performance metrics' },
] as const;

export type BuilderStepId = typeof BUILDER_STEPS[number]['id'];

export const STEP_ORDER: BuilderStepId[] = BUILDER_STEPS.map(s => s.id);
