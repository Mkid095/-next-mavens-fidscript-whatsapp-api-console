// Payments API
import { fetchApi } from './api';

export const paymentsApi = {
  getPackages: () =>
    fetchApi<{ id: string; name: string; tokens: number; price_kes: number; bonus_tokens: number }[]>(
      '/api/payments/packages'
    ),

  initiatePayment: (data: { package_id: string; phone_number: string }) =>
    fetchApi<{ checkout_request_id: string; status: string }>(
      '/api/payments/initiate',
      { method: 'POST', body: JSON.stringify(data) }
    ),
};
