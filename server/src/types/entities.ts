// User types
export interface User {
  id: string;
  email: string;
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
  /** Additional field stored in DB but not in core Instance type */
  evolution_name?: string;
}
