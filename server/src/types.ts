// User types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'client';
  created_at: string;
  last_login: string | null;
}

// Plan types
export interface Plan {
  id: string;
  name: string;
  description: string | null;
  max_instances: number;
  max_messages_per_month: number;
  msg_per_min: number;
  price_monthly: number;
  price_yearly: number;
  is_active: number;
  created_at: string;
}

// Client types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  api_key: string;
  plan_id: string | null;
  is_active: number;
  msg_count_today: number;
  total_messages: number;
  last_reset: string;
  created_at: string;
}

// Instance types
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
}

// API Log types
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
}

// Audit Log types
export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  ip_address: string | null;
  timestamp: string;
}

// Inbox Message types
export interface InboxMessage {
  id: string;
  instance_id: string | null;
  client_id: string | null;
  from_number: string;
  from_name: string | null;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';
  content: string | null;
  media_url: string | null;
  is_read: number;
  timestamp: string;
}

// API Request/Response types
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

// Instance settings
export interface InstanceSettings {
  reject_calls: boolean;
  groups_ignore: boolean;
  always_online: boolean;
  read_messages: boolean;
  sync_full_history: boolean;
}

// Webhook payload types
export interface WebhookMessagePayload {
  event: 'message';
  instance: string;
  data: {
    key: {
      id: string;
      remote: string;
      from_me: boolean;
    };
    pushName: string;
    message: {
      conversation?: string;
      imageMessage?: { url: string; caption?: string };
      audioMessage?: { url: string };
      videoMessage?: { url: string; caption?: string };
      documentMessage?: { url: string; fileName: string };
      locationMessage?: { degreesLatitude: number; degreesLongitude: number };
    };
    messageType: string;
    timestamp: number;
  };
}

export interface WebhookConnectionPayload {
  event: 'connection';
  instance: string;
  data: {
    state: InstanceStatus;
    qrcode?: string;
  };
}

export interface WebhookQrcodePayload {
  event: 'qrcode';
  instance: string;
  data: {
    code: string;
    image: string;
  };
}

// Analytics types
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
