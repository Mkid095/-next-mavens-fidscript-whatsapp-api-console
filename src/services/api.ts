// FIDScript API Service
// Connects frontend to backend API

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get admin token from localStorage
function getAdminToken(): string | null {
  return localStorage.getItem('fidscript_admin_token');
}

// Auth headers
function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ====================
// AUTH API
// ====================

export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{ token: string; user: { id: string; email: string; name: string; role: string } }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    ),

  register: (email: string, password: string, name: string) =>
    fetchApi<{ token: string; user: { id: string; email: string; name: string; role: string } }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }
    ),

  me: () =>
    fetchApi<{ id: string; email: string; name: string; role: string }>(
      '/api/auth/me'
    ),

  logout: () => {
    localStorage.removeItem('fidscript_admin_token');
  },
};

// ====================
// ADMIN API
// ====================

export const adminApi = {
  getInstances: () =>
    fetchApi<Instance[]>('/api/admin/instances'),

  getAnalytics: () =>
    fetchApi<AnalyticsData>('/api/admin/analytics'),

  getLogs: (page = 1, limit = 50) =>
    fetchApi<ApiLog[]>(`/api/admin/logs?page=${page}&limit=${limit}`),

  getStats: () =>
    fetchApi<{ total_clients: number; active_clients: number; messages_today: number }>(
      '/api/stats'
    ),
};

// ====================
// CLIENTS API
// ====================

export const clientsApi = {
  getAll: () =>
    fetchApi<Client[]>('/api/clients'),

  getOne: (id: string) =>
    fetchApi<Client & { instances: Instance[] }>(`/api/clients/${id}`),

  create: (data: { name: string; email: string; phone?: string; plan_id?: string }) =>
    fetchApi<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggle: (id: string) =>
    fetchApi<{ id: string; is_active: number }>(`/api/clients/${id}/toggle`, {
      method: 'PATCH',
    }),

  resetKey: (id: string) =>
    fetchApi<{ api_key: string }>(`/api/clients/${id}/reset-key`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    fetchApi<void>(`/api/clients/${id}`, {
      method: 'DELETE',
    }),
};

// ====================
// PLANS API
// ====================

export const plansApi = {
  getAll: () =>
    fetchApi<Plan[]>('/api/plans'),

  getOne: (id: string) =>
    fetchApi<Plan>(`/api/plans/${id}`),

  create: (data: Partial<Plan>) =>
    fetchApi<Plan>('/api/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Plan>) =>
    fetchApi<Plan>(`/api/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/api/plans/${id}`, {
      method: 'DELETE',
    }),
};

// ====================
// INSTANCES API
// ====================

export const instancesApi = {
  create: (data: { name: string; display_name?: string; client_id?: string }) =>
    fetchApi<Instance>('/api/instance/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCredentials: (name: string) =>
    fetchApi<{
      instance_name: string;
      instance_token: string;
      client_api_key: string;
      api_base_url: string;
      endpoints: Record<string, string>;
    }>(`/api/instance/credentials/${name}`),

  getSettings: (name: string) =>
    fetchApi<InstanceSettings>(`/api/instance/settings/${name}`),

  updateSettings: (name: string, settings: Partial<InstanceSettings>) =>
    fetchApi<InstanceSettings>(`/api/instance/settings/${name}`, {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  getWebhook: (name: string) =>
    fetchApi<{ webhook_url: string | null; webhook_enabled: boolean }>(
      `/api/instance/webhook/${name}`
    ),

  setWebhook: (name: string, webhook_url: string, enabled: boolean) =>
    fetchApi<{ webhook_url: string; webhook_enabled: boolean }>(
      `/api/instance/webhook/${name}`,
      {
        method: 'POST',
        body: JSON.stringify({ webhook_url, enabled }),
      }
    ),

  connect: (name: string) =>
    fetchApi<{ qrcode: string; qrcode_image: string; expires_in: number }>(
      `/api/instance/connect/${name}`
    ),

  getConnectionState: (name: string) =>
    fetchApi<{ name: string; status: string; phone_number: string | null; qr_code: string | null }>(
      `/api/instance/connectionState/${name}`
    ),

  disconnect: (name: string) =>
    fetchApi<void>(`/api/instance/logout/${name}`, {
      method: 'DELETE',
    }),

  delete: (name: string) =>
    fetchApi<void>(`/api/instance/delete/${name}`, {
      method: 'DELETE',
    }),

  sendText: (name: string, to: string, message: string, apiKey: string) =>
    fetchApi<{ messageId: string; to: string; message: string; timestamp: string }>(
      `/api/instance/sendText/${name}`,
      {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
        body: JSON.stringify({ to, message }),
      }
    ),

  sendMedia: (name: string, to: string, media_url: string, media_type: string, caption?: string, apiKey?: string) =>
    fetchApi<{ messageId: string; to: string; media_url: string }>(
      `/api/instance/sendMedia/${name}`,
      {
        method: 'POST',
        headers: apiKey ? { 'X-API-Key': apiKey } : getAuthHeaders(),
        body: JSON.stringify({ to, media_url, media_type, caption }),
      }
    ),
};

// ====================
// TYPES
// ====================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  created_at: string;
  last_login: string | null;
}

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
  plan_name?: string;
  price_monthly?: number;
}

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

// Export the base URL for use in components
export { API_BASE_URL };
