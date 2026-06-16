// Clients API + Plans API
import { fetchApi, type ApiResponse } from './api';
import type { Instance } from './api';

export interface TokenTransaction {
  id: string;
  client_id: string;
  type: string;
  amount: number;
  reference: string | null;
  mpesa_receipt: string | null;
  status: string;
  created_at: string;
}

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
  token_balance?: number;
  msg_count_today: number;
  total_messages: number;
  last_reset: string;
  created_at: string;
  plan_name?: string;
  price_monthly?: number;
}

export const clientsApi = {
  getAll: () => fetchApi<Client[]>('/api/clients'),

  getOne: (id: string) =>
    fetchApi<Client & { instances: Instance[] }>(`/api/clients/${id}`),

  create: (data: { name: string; email: string; phone?: string; plan_id?: string }) =>
    fetchApi<Client>('/api/clients', { method: 'POST', body: JSON.stringify(data) }),

  toggle: (id: string) =>
    fetchApi<{ id: string; is_active: number }>(`/api/clients/${id}/toggle`, { method: 'PATCH' }),

  resetKey: (id: string) =>
    fetchApi<{ api_key: string }>(`/api/clients/${id}/reset-key`, { method: 'POST' }),

  delete: (id: string) =>
    fetchApi<void>(`/api/clients/${id}`, { method: 'DELETE' }),

  awardTokens: (id: string, amount: number, note?: string) =>
    fetchApi<{ id: string; token_balance: number }>(
      `/api/clients/${id}/award-tokens`,
      { method: 'POST', body: JSON.stringify({ amount, note }) }
    ),
};

export const plansApi = {
  getAll: () => fetchApi<Plan[]>('/api/plans'),

  getOne: (id: string) => fetchApi<Plan>(`/api/plans/${id}`),

  create: (data: Partial<Plan>) =>
    fetchApi<Plan>('/api/plans', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Plan>) =>
    fetchApi<Plan>(`/api/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) => fetchApi<void>(`/api/plans/${id}`, { method: 'DELETE' }),
};
