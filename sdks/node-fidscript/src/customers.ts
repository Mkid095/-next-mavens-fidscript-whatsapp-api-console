/**
 * customers.ts - /api/v1/customers
 *
 * Public API for listing and inspecting customers.
 * Authenticates with X-API-Key.
 */
import type { Customer, CustomerTimelineEvent, PaginatedResponse } from '@fidscript/types';
import type { FidscriptClient } from './client.js';

export class CustomersResource {
  constructor(private client: FidscriptClient) {}

  /**
   * GET /api/v1/customers
   * List all customers for the authenticated workspace.
   */
  list(params?: { page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const tail = qs.size ? `?${qs}` : '';
    return this.client.request<PaginatedResponse<Customer[]>>(
      'GET', `/api/v1/customers${tail}`, undefined, { auth: 'apikey' },
    );
  }

  /**
   * GET /api/v1/customers/:id
   */
  get(id: string) {
    return this.client.request<{ success: boolean; data: Customer }>(
      'GET', `/api/v1/customers/${id}`, undefined, { auth: 'apikey' },
    );
  }

  /**
   * GET /api/v1/customers/:id/timeline
   */
  timeline(id: string, params?: { limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    const tail = qs.size ? `?${qs}` : '';
    return this.client.request<{ success: boolean; data: CustomerTimelineEvent[] }>(
      'GET', `/api/v1/customers/${id}/timeline${tail}`, undefined, { auth: 'apikey' },
    );
  }
}
