// API Type Definitions
// Shared types used across services

export type InstanceStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface Instance {
  id: string;
  name: string;
  display_name: string | null;
  client_id: string | null;
  instance_token: string;
  status: InstanceStatus;
  phone_number: string | null;
  qr_code: string | null;
  settings: string;
  webhook_url: string | null;
  webhook_enabled: number;
  msg_count_today: number;
  total_messages: number;
  last_active: string | null;
  created_at: string;
  client_name?: string;
}

export interface ApiLog {
  id: string;
  instance_id: string | null;
  client_id: string | null;
  method: string;
  endpoint: string;
  request_body: string | null;
  response_status: number | null;
  response_body: string | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  instance_name?: string;
  client_name?: string;
}

export interface InstanceSettings {
  reject_calls: boolean;
  groups_ignore: boolean;
  always_online: boolean;
  read_messages: boolean;
  sync_full_history: boolean;
}

export interface AnalyticsData {
  total_clients: number;
  active_clients: number;
  total_instances: number;
  connected_instances: number;
  messages_today: number;
  messages_this_month: number;
  delivery_rate: number;
  daily_trends: DailyTrend[];
  top_clients: TopClient[];
  top_instances: TopInstance[];
}

export interface DailyTrend {
  date: string;
  messages_sent: number;
  messages_delivered: number;
  failed_messages: number;
}

export interface TopClient {
  client_id: string;
  client_name: string;
  total_messages: number;
  active_instances: number;
}

export interface TopInstance {
  instance_id: string;
  instance_name: string;
  client_name: string;
  total_messages: number;
  status: InstanceStatus;
}

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price_kes: number;
  bonus_tokens: number;
}

export interface DailyUsage {
  date: string;
  messages_sent: number;
  messages_delivered: number;
  tokens_used: number;
}
