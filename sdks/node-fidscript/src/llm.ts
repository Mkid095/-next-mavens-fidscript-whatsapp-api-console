/**
 * llm.ts - BYO LLM connection management.
 * GET/POST/PUT/DELETE /api/platform/llm-connections[/:id]
 */
import type { FidscriptClient } from './client.js';
import type { LlmConnection, CreateLlmConnection } from './types.js';

export class LlmResource {
  constructor(private readonly client: FidscriptClient) {}

  list(): Promise<LlmConnection[]> {
    return this.client.request<LlmConnection[]>('GET', '/api/platform/llm-connections', undefined, { auth: 'jwt' });
  }

  create(body: CreateLlmConnection): Promise<{ id: string; message?: string }> {
    return this.client.request('POST', '/api/platform/llm-connections', body, { auth: 'jwt' });
  }

  get(id: string): Promise<LlmConnection> {
    return this.client.request('GET', `/api/platform/llm-connections/${encodeURIComponent(id)}`, undefined, { auth: 'jwt' })
      .then(async () => {
        const all = await this.list();
        const found = all.find((c) => c.id === id);
        if (!found) throw new Error(`Connection ${id} not found`);
        return found;
      });
  }

  update(id: string, body: Partial<CreateLlmConnection> & { enabled?: boolean }): Promise<{ success: boolean; message?: string }> {
    return this.client.request('PUT', `/api/platform/llm-connections/${encodeURIComponent(id)}`, body, { auth: 'jwt' });
  }

  delete(id: string): Promise<{ success: boolean; message?: string }> {
    return this.client.request('DELETE', `/api/platform/llm-connections/${encodeURIComponent(id)}`, undefined, { auth: 'jwt' });
  }

  test(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.client.request('POST', `/api/platform/llm-connections/${encodeURIComponent(id)}/test`, {}, { auth: 'jwt' });
  }
}