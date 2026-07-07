/**
 * campaigns.ts — /api/v1/campaigns
 *
 * Public API for listing campaigns.
 */
import type { Campaign, PaginatedResponse } from '@fidscript/types';
import type { FidscriptClient } from './client.js';

export class CampaignsResource {
  constructor(private client: FidscriptClient) {}

  /**
   * GET /api/v1/campaigns
   */
  list(params?: { status?: string; page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const tail = qs.size ? `?${qs}` : '';
    return this.client.request<PaginatedResponse<Campaign[]>>(
      'GET', `/api/v1/campaigns${tail}`, undefined, { auth: 'apikey' },
    );
  }

  /**
   * GET /api/v1/campaigns/:id
   */
  get(id: string) {
    return this.client.request<{ success: boolean; data: Campaign }>(
      'GET', `/api/v1/campaigns/${id}`, undefined, { auth: 'apikey' },
    );
  }
}
