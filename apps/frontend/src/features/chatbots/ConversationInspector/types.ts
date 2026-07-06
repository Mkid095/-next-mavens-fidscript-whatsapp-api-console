export interface Conversation {
  conversationId: string;
  customerName: string;
  customerNumber: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
  lowConfidence: boolean;
  wasEscalated: boolean;
}

export interface AIMetadata {
  confidence: number;
  model: string;
  promptVersion: string | null;
  botVersion: string | null;
  sources: Array<{ sourceName: string; sourceType: string; relevanceScore?: number }> | null;
  tools: Array<{ toolId: string; toolName: string; resultSummary?: string; input?: unknown; output?: unknown; durationMs?: number }> | null;
  matchedTrigger: string | null;
  matchedRule: string | null;
  skipReason: string | null;
}

export interface ThreadMessage {
  id: string;
  direction: 'incoming' | 'outgoing' | 'system';
  content: string;
  timestamp: string;
  fromName: string;
  fromNumber: string;
  aiMetadata: AIMetadata | null;
}

export interface Trace {
  messageId: string;
  step: string;
  durationMs: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ReplayResult {
  matchedTrigger: string | null;
  matchedRule: string | null;
  confidence: number;
  shouldRespond: boolean;
  skipReason: string | null;
}

export const ENGINE_VERSION = '0.9.0';

export const SKIP_LABELS: Record<string, string> = {
  confidence_threshold: 'AI confidence below threshold',
  no_trigger_matched: 'No trigger matched this message',
  handoff_active: 'Human handoff was active',
  bot_disabled: 'Chatbot was disabled',
  rule_skip: 'Response rule returned skip',
  workflow_stop: 'Workflow execution stopped',
  manual_override: 'Manual override was active',
};
