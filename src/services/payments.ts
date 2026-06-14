// Payments API
import { fetchApi } from './api';

export interface PaymentTransaction {
  id: string;
  client_id: string;
  package_id: string | null;
  amount_kes: number;
  phone_number: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payhero_reference: string | null;
  checkout_request_id: string | null;
  created_at: string;
  package_name?: string;
  tokens?: number;
  bonus_tokens?: number;
}

export const paymentsApi = {
  getPackages: () =>
    fetchApi<{ id: string; name: string; tokens: number; price_kes: number; bonus_tokens: number }[]>(
      '/api/payments/packages'
    ),

  initiatePayment: (data: { package_id: string; phone_number: string }) =>
    fetchApi<{ payment_id: string; checkout_request_id: string; reference: string; status: string; amount: number; tokens: number }>(
      '/api/payments/initiate',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  getHistory: () =>
    fetchApi<PaymentTransaction[]>('/api/payments/client/history'),

  getPaymentStatus: (reference: string) =>
    fetchApi<{ status: string; amount: number; tokens: number; created_at: string }>(
      `/api/payments/status/${reference}`
    ),

  initiateCustomPayment: (data: { tokens: number; phone_number: string }) =>
    fetchApi<{ payment_id: string; checkout_request_id: string; reference: string; status: string; tokens: number; amount: number }>(
      '/api/payments/custom',
      { method: 'POST', body: JSON.stringify(data) }
    ),
};
