/**
 * chatbots.ts — full chatbot lifecycle.
 * GET/POST/PUT/DELETE /api/platform/chatbots[/:id]
 */
import type { FidscriptClient } from './client.js';
import type { Chatbot, ChatbotAiConfig, ChatbotHealth } from './types.js';

export interface CreateChatbot {
  instance_id: string;
  name: string;
  description?: string;
  priority?: number;
  enabled?: boolean;
  config_json?: string;
}

export class ChatbotsResource {
  constructor(private readonly client: FidscriptClient) {}

  list(): Promise<Chatbot[]> {
    return this.client.request<Chatbot[]>('GET', '/api/platform/chatbots', undefined, { auth: 'jwt' });
  }

  get(id: string): Promise<Chatbot & { aiConfig: ChatbotAiConfig[] }> {
    return this.client.request('GET', `/api/platform/chatbots/${encodeURIComponent(id)}`, undefined, { auth: 'jwt' });
  }

  create(body: CreateChatbot): Promise<{ id: string }> {
    return this.client.request('POST', '/api/platform/chatbots', body, { auth: 'jwt' });
  }

  update(id: string, body: Partial<CreateChatbot>): Promise<{ success: boolean; message?: string }> {
    return this.client.request('PUT', `/api/platform/chatbots/${encodeURIComponent(id)}`, body, { auth: 'jwt' });
  }

  delete(id: string): Promise<{ success: boolean; message?: string }> {
    return this.client.request('DELETE', `/api/platform/chatbots/${encodeURIComponent(id)}`, undefined, { auth: 'jwt' });
  }

  /** Update the AI behavior of a chatbot (model, prompt, hallucination policy, etc.) */
  setAiConfig(id: string, cfg: ChatbotAiConfig): Promise<{ success: boolean; message?: string }> {
    return this.client.request('PUT', `/api/platform/chatbots/${encodeURIComponent(id)}/ai-config`, cfg, { auth: 'jwt' });
  }

  health(id: string): Promise<ChatbotHealth> {
    return this.client.request('GET', `/api/platform/chatbots/${encodeURIComponent(id)}/health`, undefined, { auth: 'jwt' });
  }

  publish(id: string, draftJson?: string): Promise<{ jobId: string }> {
    return this.client.request('POST', `/api/platform/chatbots/${encodeURIComponent(id)}/publish`, draftJson ? { draft_json: draftJson } : {}, { auth: 'jwt' });
  }
}