// Auth API - handles admin and client authentication
import { fetchApi, getAuthHeaders, type ApiResponse } from './api';

export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{ token: string; user: { id: string; email: string; name: string; role: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  clientLogin: (email: string, password: string) =>
    fetchApi<{ token: string; client: import('./clients').Client }>(
      '/api/auth/client-login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  clientRegister: (name: string, email: string, phone: string, password: string) =>
    fetchApi<{ client: import('./clients').Client; message: string }>(
      '/api/auth/client-register',
      { method: 'POST', body: JSON.stringify({ name, email, phone, password }) }
    ),

  me: () =>
    fetchApi<{ id: string; email: string; name: string; role: string }>('/api/auth/me'),

  clientMe: () =>
    fetchApi<import('./clients').Client>('/api/auth/client/me'),

  clientTokens: () =>
    fetchApi<{ balance: number; history: import('./clients').TokenTransaction[] }>(
      '/api/auth/client/tokens'
    ),

  logout: () => {
    localStorage.removeItem('fidscript_admin_token');
    localStorage.removeItem('fidscript_client_token');
  },

  adminStats: () =>
    fetchApi<{ total_clients: number; total_messages: number; delivery_rate: number; uptime: string }>(
      '/api/stats'
    ),
};
