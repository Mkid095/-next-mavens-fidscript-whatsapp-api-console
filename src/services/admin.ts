// Admin API - platform analytics and management
import { fetchApi } from './api';
import type { Instance, ApiLog, AnalyticsData } from './types';

export const adminApi = {
  getInstances: () => fetchApi<Instance[]>('/api/admin/instances'),

  getAnalytics: () => fetchApi<AnalyticsData>('/api/admin/analytics'),

  getLogs: (page = 1, limit = 50) =>
    fetchApi<ApiLog[]>(`/api/admin/logs?page=${page}&limit=${limit}`),

  getStats: () =>
    fetchApi<{ total_clients: number; active_clients: number; messages_today: number }>(
      '/api/stats'
    ),
};
