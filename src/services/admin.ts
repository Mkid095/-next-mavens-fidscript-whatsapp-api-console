// Admin API - platform analytics and management
import { fetchApi } from './api';
import type { Instance, ApiLog, AnalyticsData } from './types';
import type { InboxMessage } from '../types';

export interface AuditEvent {
  id: string;
  type: string;
  timestamp: string;
  actorId: string | null;
  actorType: 'user' | 'system' | 'api_key' | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditEventsResponse {
  events: AuditEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditEventsFilters {
  actorId?: string;
  actorType?: 'user' | 'system' | 'api_key';
  resourceType?: string;
  resourceId?: string;
  eventType?: string;
  ipAddress?: string;
  failedOnly?: boolean;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const adminApi = {
  getInstances: () => fetchApi<Instance[]>('/api/admin/instances'),

  getAnalytics: () => fetchApi<AnalyticsData>('/api/admin/analytics'),

  getLogs: (page = 1, limit = 50) =>
    fetchApi<ApiLog[]>(`/api/admin/logs?page=${page}&limit=${limit}`),

  getStats: () =>
    fetchApi<{ total_clients: number; active_clients: number; messages_today: number }>(
      '/api/stats'
    ),

  getMessages: (page = 1, limit = 50, direction?: 'incoming' | 'outgoing') => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (direction) params.set('direction', direction);
    return fetchApi<InboxMessage[]>(`/api/admin/messages?${params}`);
  },

  replayMessage: (id: string) =>
    fetchApi<{ replayed: boolean; webhook_status: number }>(`/api/admin/messages/${id}/replay`, { method: 'POST' }),

  /** Platform audit log — all events with optional filters (platform admin only) */
  getAuditEvents: (filters: AuditEventsFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.actorId) params.set('actorId', filters.actorId);
    if (filters.actorType) params.set('actorType', filters.actorType);
    if (filters.resourceType) params.set('resourceType', filters.resourceType);
    if (filters.resourceId) params.set('resourceId', filters.resourceId);
    if (filters.eventType) params.set('eventType', filters.eventType);
    if (filters.ipAddress) params.set('ipAddress', filters.ipAddress);
    if (filters.failedOnly) params.set('failedOnly', 'true');
    if (filters.fromDate) params.set('fromDate', filters.fromDate);
    if (filters.toDate) params.set('toDate', filters.toDate);
    if (filters.search) params.set('search', filters.search);
    params.set('page', String(filters.page ?? 1));
    params.set('limit', String(filters.limit ?? 50));
    return fetchApi<AuditEventsResponse>(`/api/admin/audit/events?${params}`);
  },
};
