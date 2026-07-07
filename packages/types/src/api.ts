/**
 * api.ts — API request/response types shared across SDK, CLI, and frontend.
 */

// ── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Auth & account ───────────────────────────────────────────────────────────

export interface Whoami {
  id: string;
  name: string;
  email: string;
  phone: string;
  token_balance: number;
  plan: { id: string; name: string } | null;
  api_key: string;
  instance_count?: number;
}

export interface Usage {
  token_balance: number;
  sends_today: number;
  sends_this_month: number;
  api_requests_today: number;
}

// ── Analytics (§13) ──────────────────────────────────────────────────────────────

export type AnalyticsPeriod = 'hour' | 'day' | 'week' | 'month';

export interface MetricRollup {
  metric_type: string;
  entity_type: string | null;
  period: AnalyticsPeriod;
  period_start: string;
  value: number;
  extra: string | null;
}

export interface AnalyticsOverview {
  [metric_type: string]: number;
}

// ── Customers (v1) ─────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  primary_identifier: string | null;
  channel: string | null;
  created_at: string;
  last_seen_at: string | null;
}

export interface CustomerTimelineEvent {
  id: string;
  type: string;
  entity_type: string;
  entity_id: string;
  conversation_id: string | null;
  actor_user_id: string | null;
  payload: string;
  created_at: string;
}

// ── Conversations (v1) ────────────────────────────────────────────────────────

export type ConversationStatus = 'open' | 'pending' | 'waiting_on_customer' | 'resolved' | 'closed';
export type ConversationPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Conversation {
  id: string;
  customer_id: string;
  channel: string;
  instance_id: string | null;
  chat_id: string;
  status: ConversationStatus;
  priority: ConversationPriority;
  assignee_type: 'user' | 'team' | 'unassigned';
  assignee_id: string | null;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  message_type: string;
  status: string;
  created_at: string;
  from_number: string;
  from_name: string;
  is_ai_response: boolean;
}

// ── Campaigns (v1) ─────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'failed';
  type: 'bulk' | 'drip' | 'status';
  workspace_id: string;
  created_at: string;
  sent_count?: number;
  failed_count?: number;
}

// ── Webhooks (v1) ─────────────────────────────────────────────────────────────

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'disabled';
  created_at: string;
}
