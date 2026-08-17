/**
 * billing.ts - /api/v1/usage and /api/admin/token-costs
 *
 * Token balance, usage history, and (admin) pricing management.
 */
import type { FidscriptClient } from './client.js';

export interface TokenUsage {
  requests_today: number;
  requests_month: number;
  sends_month: number;
  token_spend_month: number;
  failed_requests_month: number;
}

export interface TokenCost {
  id: string;
  action: string;
  display_name: string;
  token_cost: number;
  category: string;
  is_active: number;
}

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price_usd: number;
  price_kes: number;
  is_active: number;
}

export class BillingResource {
  constructor(private client: FidscriptClient) {}

  /** GET /api/v1/usage - token balance and usage summary (API key auth) */
  usage() {
    return this.client.request<{
      success: boolean;
      data: {
        token_balance: number;
        sends_today: number;
        sends_this_month: number;
        api_requests_today: number;
      };
    }>('GET', '/api/v1/usage', undefined, { auth: 'apikey' });
  }

  /** GET /api/v1/usage/detailed - extended usage breakdown (admin JWT) */
  usageDetailed() {
    return this.client.request<{ success: boolean; data: TokenUsage }>(
      'GET', '/api/v1/usage', undefined, { auth: 'jwt' },
    );
  }
}

export class AdminBillingResource {
  constructor(private client: FidscriptClient) {}

  /** GET /api/admin/token-costs - list all action costs */
  getTokenCosts() {
    return this.client.request<{ success: boolean; data: TokenCost[] }>(
      'GET', '/api/admin/token-costs', undefined, { auth: 'jwt' },
    );
  }

  /** PUT /api/admin/token-costs/:id - update a token cost */
  updateTokenCost(id: string, tokenCost: number) {
    return this.client.request<{ success: boolean }>(
      'PUT', `/api/admin/token-costs/${id}`, { token_cost: tokenCost }, { auth: 'jwt' },
    );
  }

  /** GET /api/admin/token-packages - list token packages */
  getPackages() {
    return this.client.request<{ success: boolean; data: TokenPackage[] }>(
      'GET', '/api/admin/token-packages', undefined, { auth: 'jwt' },
    );
  }

  /** POST /api/admin/token-packages - create a token package */
  createPackage(data: Omit<TokenPackage, 'id'>) {
    return this.client.request<{ success: boolean; data: TokenPackage }>(
      'POST', '/api/admin/token-packages', data, { auth: 'jwt' },
    );
  }

  /** PUT /api/admin/token-packages/:id - update a package */
  updatePackage(id: string, data: Partial<Omit<TokenPackage, 'id'>>) {
    return this.client.request<{ success: boolean }>(
      'PUT', `/api/admin/token-packages/${id}`, data, { auth: 'jwt' },
    );
  }

  /** DELETE /api/admin/token-packages/:id */
  deletePackage(id: string) {
    return this.client.request<{ success: boolean }>(
      'DELETE', `/api/admin/token-packages/${id}`, undefined, { auth: 'jwt' },
    );
  }
}
