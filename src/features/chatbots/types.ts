/**
 * Fidscript Conversation Automation Platform
 * Chatbot Builder — Shared Types
 */

// ─── Step Definitions ───────────────────────────────────────────────────────────

export const BUILDER_STEPS = [
  { id: 'general',           label: 'General',            description: 'Name, description & template' },
  { id: 'audience',          label: 'Audience',           description: 'Who should this bot talk to?' },
  { id: 'ai-brain',          label: 'AI Brain',           description: 'Provider, model & memory' },
  { id: 'knowledge',          label: 'Knowledge',          description: 'What information does it know?' },
  { id: 'data-connections',  label: 'Data Connections',  description: 'Databases & API integrations' },
  { id: 'tools',             label: 'Tools',              description: 'Actions the bot can perform' },
  { id: 'groups',            label: 'Groups',             description: 'WhatsApp group behavior' },
  { id: 'handoff',           label: 'Human Handoff',      description: 'When to transfer to humans' },
  { id: 'test',              label: 'Test',               description: 'Simulate conversations' },
  { id: 'analytics',         label: 'Analytics',          description: 'Performance metrics' },
] as const;

export type BuilderStepId = typeof BUILDER_STEPS[number]['id'];

export const STEP_ORDER = BUILDER_STEPS.map(s => s.id);

// ─── Chatbot Templates ────────────────────────────────────────────────────────

export type ChatbotTemplate =
  | 'customer-support'
  | 'sales-assistant'
  | 'faq-bot'
  | 'lead-qualification'
  | 'booking-assistant'
  | 'ecommerce'
  | 'custom';

export const TEMPLATE_META: Record<ChatbotTemplate, { label: string; description: string; icon: string }> = {
  'customer-support':   { label: 'Customer Support',   description: 'Handle support requests, FAQs & ticket routing',     icon: '🎧' },
  'sales-assistant':    { label: 'Sales Assistant',    description: 'Help customers find products & complete purchases',  icon: '💬' },
  'faq-bot':            { label: 'FAQ Bot',              description: 'Answer common questions from your knowledge base',  icon: '❓' },
  'lead-qualification': { label: 'Lead Qualification',  description: 'Qualify leads & capture contact information',       icon: '🎯' },
  'booking-assistant':  { label: 'Booking Assistant',   description: 'Schedule appointments & manage reservations',      icon: '📅' },
  'ecommerce':          { label: 'E-commerce',           description: 'Product search, cart & order management',            icon: '🛒' },
  'custom':             { label: 'Custom',                description: 'Build from scratch with full control',               icon: '⚙️' },
};

// ─── General ───────────────────────────────────────────────────────────────────

export interface GeneralDraft {
  name: string;
  description: string;
  template: ChatbotTemplate;
  priority: number; // 0-100
  enabled: boolean;
}

// ─── Audience ─────────────────────────────────────────────────────────────────

export type AudienceContactMode =
  | 'everyone'
  | 'new-contacts'
  | 'existing-customers'
  | 'tagged-contacts'
  | 'specific-contacts'
  | 'whitelist'
  | 'blacklist';

export type GroupMode =
  | 'disabled'
  | 'mention-only'
  | 'reply-to-all'
  | 'admin-messages-only';

export interface AudienceDraft {
  contactMode: AudienceContactMode;
  tags: string[];           // for tagged-contacts
  contactIds: string[];     // for specific-contacts / whitelist / blacklist
  priority: number;         // bot priority when multiple match
  groupMode: GroupMode;
  groupIds: string[];        // allowed group JIDs
}

// ─── AI Brain ─────────────────────────────────────────────────────────────────

export type AIProvider = 'fidscript' | 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'ollama' | 'custom';

export interface MemorySetting {
  enabled: boolean;
  label: string;
  description: string;
}

export interface AIBrainDraft {
  provider: AIProvider;
  // BYOLLM fields
  providerName: string;
  baseUrl: string;
  apiKey: string;
  apiFormat: string;
  // Connection
  llmConnectionId: string;
  // Model
  model: string;
  contextLength: number;
  maxOutputTokens: number;
  temperature: number;
  // Memory
  memorySettings: MemorySetting[];
  // Prompt
  systemPrompt: string;
  // Policies
  hallucinationPolicy: 'strict' | 'balanced' | 'creative';
}

// ─── Knowledge ─────────────────────────────────────────────────────────────────

export type KnowledgeSourceType = 'url' | 'faq' | 'pdf' | 'csv' | 'json' | 'text' | 'database' | 'api';

export interface KnowledgeSource {
  id: string;
  type: KnowledgeSourceType;
  name: string;
  status: 'active' | 'indexing' | 'error' | 'disabled';
  chunkCount: number;
  ref: string;           // URL, file path, table name, etc.
  content: string;       // raw content or description
  errorMessage?: string; // populated when status === 'error'
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDraft {
  sources: KnowledgeSource[];
}

// ─── Data Connections ──────────────────────────────────────────────────────────

export type DbType = 'postgresql' | 'mysql' | 'rest-api' | 'shopify' | 'woocommerce' | 'custom';

export interface DataConnection {
  id: string;
  type: DbType;
  name: string;
  status: 'connected' | 'error' | 'disconnected';
  config: Record<string, string>;
  tables?: string[];      // for database types
  fields?: string[];      // exposed fields
}

export interface DataConnectionsDraft {
  connections: DataConnection[];
}

// ─── Tools ─────────────────────────────────────────────────────────────────────

export type ToolType = 'http-request' | 'database-query' | 'webhook' | 'graphql' | 'function';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  enabled: boolean;
  requireConfirmation: boolean;
  costUnits: number;
  config: Record<string, unknown>;
}

export interface ToolsDraft {
  tools: ToolDefinition[];
}

// ─── Groups ────────────────────────────────────────────────────────────────────

export interface GroupSetting {
  groupJid: string;
  groupName: string;
  respondWhenMentioned: boolean;
  respondToAll: boolean;
  silenceOnBotReply: boolean;
  cooldownSeconds: number;
}

export interface GroupsDraft {
  settings: GroupSetting[];
}

// ─── Handoff ───────────────────────────────────────────────────────────────────

export type HandoffTrigger =
  | 'customer-requests'
  | 'low-confidence'
  | 'negative-sentiment'
  | 'too-many-messages'
  | 'tool-failure'
  | 'keyword-escalate';

export interface HandoffDraft {
  triggers: HandoffTrigger[];
  targetTeamId: string;
  targetTeamName: string;
  maxRetries: number;
  fallbackReply: string;
}

// ─── Test ─────────────────────────────────────────────────────────────────────

export interface TestMessage {
  id: string;
  role: 'customer' | 'bot';
  text: string;
  timestamp: string;
  matchedTrigger?: string;
  confidence?: number;
  tokensUsed?: number;
  toolsCalled?: string[];
  knowledgeUsed?: string[];
}

export interface TestDraft {
  messages: TestMessage[];
  testCases: { id: string; input: string; description: string; status: 'pending' | 'passed' | 'failed' }[];
}

// ─── Full Chatbot Draft ───────────────────────────────────────────────────────

export interface ChatbotDraft {
  // Metadata
  id?: string;              // set when editing existing bot
  instanceId: string;       // WhatsApp container (required even in create flow)
  createdAt?: string;

  // Step drafts
  general: GeneralDraft;
  audience: AudienceDraft;
  aiBrain: AIBrainDraft;
  knowledge: KnowledgeDraft;
  dataConnections: DataConnectionsDraft;
  tools: ToolsDraft;
  groups: GroupsDraft;
  handoff: HandoffDraft;
  test: TestDraft;

  // Builder state
  currentStep: BuilderStepId;
  completedSteps: BuilderStepId[];
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt?: string;
  errors: Partial<Record<BuilderStepId, string>>;
}

// ─── Publish Job (mirrors server-side ChatbotPublishJob) ───────────────────────

export type PublishJobStatus = 'pending' | 'building' | 'indexing' | 'compiling' | 'activating' | 'done' | 'failed';

export interface PublishJob {
  id: string;
  status: PublishJobStatus;
  progress: number;
  current_step: string | null;
  message: string | null;
  error: string | null;
  result_json: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Chatbot Version ───────────────────────────────────────────────────────────

export interface ChatbotVersion {
  id: string;
  chatbot_id: string;
  version_number: number;
  change_summary: string;
  created_at: string;
  compiled_prompt: string | null;
  compiled_tools: string | null;
  compiled_capabilities: string | null;
}

// ─── Default Factories ─────────────────────────────────────────────────────────

export function createDefaultGeneral(): GeneralDraft {
  return { name: '', description: '', template: 'custom', priority: 50, enabled: true };
}

export function createDefaultAudience(): AudienceDraft {
  return {
    contactMode: 'everyone',
    tags: [],
    contactIds: [],
    priority: 50,
    groupMode: 'disabled',
    groupIds: [],
  };
}

export function createDefaultAIBrain(): AIBrainDraft {
  return {
    provider: 'fidscript',
    providerName: '',
    baseUrl: '',
    apiKey: '',
    apiFormat: 'chat_completions',
    llmConnectionId: '',
    model: 'gemini-2.0-flash',
    contextLength: 4096,
    maxOutputTokens: 1024,
    temperature: 0.7,
    memorySettings: [
      { enabled: true,  label: 'Customer names',      description: 'Remember customer names across conversations' },
      { enabled: true,  label: 'Preferences',         description: 'Remember stated preferences & stated likes' },
      { enabled: false, label: 'Order history',        description: 'Remember past orders & purchases' },
      { enabled: false, label: 'Custom attributes',     description: 'Remember custom contact fields' },
    ],
    systemPrompt: '',
    hallucinationPolicy: 'balanced',
  };
}

export function createDefaultKnowledge(): KnowledgeDraft {
  return { sources: [] };
}

export function createDefaultDataConnections(): DataConnectionsDraft {
  return { connections: [] };
}

export function createDefaultTools(): ToolsDraft {
  return { tools: [] };
}

export function createDefaultGroups(): GroupsDraft {
  return { settings: [] };
}

export function createDefaultHandoff(): HandoffDraft {
  return {
    triggers: [],
    targetTeamId: '',
    targetTeamName: '',
    maxRetries: 3,
    fallbackReply: "I'm not sure I can help with that. Let me connect you with a team member.",
  };
}

export function createDefaultTest(): TestDraft {
  return { messages: [], testCases: [] };
}

export function createDefaultDraft(instanceId: string = ''): ChatbotDraft {
  return {
    instanceId,
    general: createDefaultGeneral(),
    audience: createDefaultAudience(),
    aiBrain: createDefaultAIBrain(),
    knowledge: createDefaultKnowledge(),
    dataConnections: createDefaultDataConnections(),
    tools: createDefaultTools(),
    groups: createDefaultGroups(),
    handoff: createDefaultHandoff(),
    test: createDefaultTest(),
    currentStep: 'general',
    completedSteps: [],
    isDirty: false,
    isSaving: false,
    errors: {},
  };
}
