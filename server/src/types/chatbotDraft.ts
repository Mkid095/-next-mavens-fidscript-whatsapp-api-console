/**
 * Shared ChatbotDraft type for the server side.
 * Mirrors the client types from src/features/chatbots/types.ts.
 * This is the canonical server-side shape for draft payloads.
 */

export interface ChatbotDraft {
  id?: string;
  instanceId: string;
  createdAt?: string;
  general: GeneralDraft;
  audience: AudienceDraft;
  aiBrain: AIBrainDraft;
  knowledge: KnowledgeDraft;
  dataConnections: DataConnectionsDraft;
  tools: ToolsDraft;
  groups: GroupsDraft;
  handoff: HandoffDraft;
  test: TestDraft;
  currentStep: string;
  completedSteps: string[];
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt?: string;
  errors: Record<string, string>;
}

export interface GeneralDraft {
  name: string;
  description: string;
  template: string;
  priority: number;
  enabled: boolean;
}

export interface AudienceDraft {
  contactMode: string;
  tags: string[];
  contactIds: string[];
  priority: number;
  groupMode: string;
  groupIds: string[];
}

export interface AIBrainDraft {
  provider: string;
  providerName: string;
  baseUrl: string;
  apiKey: string;
  apiFormat: string;
  llmConnectionId: string;
  model: string;
  contextLength: number;
  maxOutputTokens: number;
  temperature: number;
  memorySettings: MemorySetting[];
  systemPrompt: string;
  hallucinationPolicy: string;
}

export interface MemorySetting {
  enabled: boolean;
  label: string;
  description: string;
}

export interface KnowledgeSource {
  id: string;
  type: string;
  name: string;
  status: 'active' | 'indexing' | 'error' | 'disabled';
  chunkCount: number;
  ref: string;
  content: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDraft {
  sources: KnowledgeSource[];
}

export interface DataConnection {
  id: string;
  type: string;
  name: string;
  status: 'connected' | 'error' | 'disconnected';
  config: Record<string, string>;
  tables?: string[];
  fields?: string[];
}

export interface DataConnectionsDraft {
  connections: DataConnection[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  requireConfirmation: boolean;
  costUnits: number;
  config: Record<string, unknown>;
}

export interface ToolsDraft {
  tools: ToolDefinition[];
}

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

export interface HandoffDraft {
  triggers: string[];
  targetTeamId: string;
  targetTeamName: string;
  maxRetries: number;
  fallbackReply: string;
}

export interface TestDraft {
  messages: unknown[];
  testCases: unknown[];
}

export interface PublishJob {
  id: string;
  chatbot_id: string;
  workspace_id: string;
  status: 'pending' | 'building' | 'indexing' | 'compiling' | 'activating' | 'done' | 'failed';
  progress: number;
  current_step: string | null;
  message: string | null;
  error: string | null;
  result_json: string | null;
  retry_count: number;
  last_heartbeat_at: string | null;
  worker_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotVersion {
  id: string;
  chatbot_id: string;
  version: number;
  config_snapshot_json: string;
  compiled_prompt?: string;
  compiled_tools?: string;
  compiled_capabilities?: string;
  is_published: number;
  published_at: string | null;
  published_by: string;
  change_summary: string;
  created_at: string;
}
