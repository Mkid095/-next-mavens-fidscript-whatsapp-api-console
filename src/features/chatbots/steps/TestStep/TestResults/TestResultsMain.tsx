/**
 * TestResultsMain — orchestrator + shared types for TestResults.
 * Exports all types and empty-state helpers; step components live in sibling files.
 */
import React from 'react';
import { MessageSquare, Bot } from 'lucide-react';
import { MessageBubble, TypingBubble } from './MessageBubble';
import { DebugSidebar } from './DebugSidebar';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestMessage {
  id: string;
  role: 'customer' | 'bot' | 'system';
  text: string;
  time: string;
  matchedTrigger?: string;
  matchedRule?: string;
  knowledgeSources?: string[];
  tokensUsed?: number;
  latencyMs?: number;
  confidence?: number;
}

export interface DebugPayload {
  matched_trigger?: string;
  matched_rule?: string;
  knowledge_sources?: string[];
  tokens_used?: number;
  latency_ms?: number;
  confidence?: number;
  trigger_type?: string;
  rule_confidence?: number;
  ai_response?: string;
  raw?: Record<string, unknown>;
}

// ─── Empty states ─────────────────────────────────────────────────────────────

export function EmptyConversation() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <MessageSquare className="w-8 h-8 text-[#3d3823] mb-2" />
      <p className="text-sm text-[#6e684a]">Start typing to test</p>
      <p className="text-[10px] text-[#5a554a] mt-1">
        Type a message or click a quick phrase above
      </p>
    </div>
  );
}

export function ClearedConversation() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <MessageSquare className="w-8 h-8 text-[#3d3823] mb-2" />
      <p className="text-sm text-[#6e684a]">Conversation cleared</p>
      <p className="text-[10px] text-[#5a554a] mt-1">Send a new message to start</p>
    </div>
  );
}

// ─── Re-exports ───────────────────────────────────────────────────────────────
export { MessageBubble, TypingBubble } from './MessageBubble';
export { DebugSidebar, DebugRow } from './DebugSidebar';
export { Bot };
