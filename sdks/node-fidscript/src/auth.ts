/**
 * auth.ts — magic-code login (returns API key + JWT).
 * POST /api/auth/request-code, POST /api/auth/verify-code
 */
import type { FidscriptClient } from './client.js';

export interface LoginResult {
  token: string;
  role: 'client' | 'admin';
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    token_balance: number;
    plan_id: string | null;
    api_key: string;
  };
}

export class AuthResource {
  constructor(private readonly client: FidscriptClient) {}

  /** Request a 6-digit magic code to be emailed. */
  async requestCode(email: string): Promise<{ message: string }> {
    return this.client.request<{ message: string }>('POST', '/api/auth/request-code', { email }, { auth: 'jwt' });
  }

  /** Verify the code and set the client's apiKey + jwt in-place. */
  async verifyCode(email: string, code: string): Promise<LoginResult> {
    const out = await this.client.request<LoginResult>('POST', '/api/auth/verify-code', { email, code }, { auth: 'jwt' });
    if (out.role === 'client' && out.client) {
      this.client.setApiKey(out.client.api_key);
      this.client.setJwt(out.token);
    }
    return out;
  }
}