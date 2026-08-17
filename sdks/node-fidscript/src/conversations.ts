/**
 * conversations.ts - /api/v1/conversations
 *
 * Public API for listing and inspecting conversations.
 */
import type {
  Conversation,
  ConversationMessage,
  ConversationStatus,
  ConversationPriority,
  PaginatedResponse,
} from '@fidscript/types';
import type { FidscriptClient } from './client.js';

export class ConversationsResource {
  constructor(private client: FidscriptClient) {}

  /**
   * GET /api/v1/conversations
   */
  list(params?: {
    status?: ConversationStatus;
    priority?: ConversationPriority;
    page?: number;
    limit?: number;
  }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.priority) qs.set('priority', params.priority);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const tail = qs.size ? `?${qs}` : '';
    return this.client.request<PaginatedResponse<Conversation[]>>(
      'GET', `/api/v1/conversations${tail}`, undefined, { auth: 'apikey' },
    );
  }

  /**
   * GET /api/v1/conversations/:id
   */
  get(id: string) {
    return this.client.request<{ success: boolean; data: Conversation }>(
      'GET', `/api/v1/conversations/${id}`, undefined, { auth: 'apikey' },
    );
  }

  /**
   * GET /api/v1/conversations/:id/messages
   */
  messages(id: string, params?: { limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    const tail = qs.size ? `?${qs}` : '';
    return this.client.request<{ success: boolean; data: ConversationMessage[] }>(
      'GET', `/api/v1/conversations/${id}/messages${tail}`, undefined, { auth: 'apikey' },
    );
  }
}
