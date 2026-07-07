/**
 * Fidscript Conversation Automation Platform
 * Chatbot Builder — Publish / version types
 */

// ─── Publish Job (mirrors server-side ChatbotPublishJob) ────────────────────────

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
