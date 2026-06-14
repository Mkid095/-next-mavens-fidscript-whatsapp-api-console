// Auth API — passwordless magic-code authentication (Resend email)
import { fetchApi, type ApiResponse } from './api';
import type { Client } from './clients';

export interface MagicVerifyData {
  token: string;
  role: 'admin' | 'client';
  user?: { id: string; email: string; name: string };
  client?: Client;
}

export interface ClientMagicVerifyData {
  token: string;
  client: Client;
  message?: string;
}

export const authApi = {
  // Step 1 of sign-in: request a 6-digit code to the email
  requestCode: (email: string) =>
    fetchApi<{ message: string }>('/api/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Step 2 of sign-in: verify the code and receive a JWT (admin or client)
  verifyCode: (email: string, code: string) =>
    fetchApi<MagicVerifyData>('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  // Step 1 of sign-up: request a code for a new client account
  clientRequestCode: (name: string, email: string, phone: string) =>
    fetchApi<{ message: string }>('/api/auth/client/request-code', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone }),
    }),

  // Step 2 of sign-up: verify the code, create the account, receive a JWT
  clientVerifyCode: (name: string, email: string, phone: string, code: string) =>
    fetchApi<ClientMagicVerifyData>('/api/auth/client/verify-code', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, code }),
    }),

  me: () =>
    fetchApi<{ id: string; email: string; name: string; role: string }>('/api/auth/me'),

  clientMe: () =>
    fetchApi<Client>('/api/auth/client/me'),

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
