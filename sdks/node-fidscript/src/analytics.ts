/**
 * analytics.ts - /api/v1/analytics (maps to /api/platform/analytics on backend)
 *
 * Public API for workspace analytics and metrics.
 */
import type { MetricRollup, AnalyticsOverview, AnalyticsPeriod } from '@fidscript/types';
import type { FidscriptClient } from './client.js';

export class AnalyticsResource {
  constructor(private client: FidscriptClient) {}

  /**
   * GET /api/v1/analytics/overview
   * Summed counts per metric for the current day.
   */
  overview() {
    return this.client.request<{ success: boolean; data: AnalyticsOverview }>(
      'GET', '/api/v1/analytics/overview', undefined, { auth: 'apikey' },
    );
  }

  /**
   * GET /api/v1/analytics?period=day&metric=messages_received
   * Raw metric rollups with optional period and metric type filter.
   */
  query(params?: { period?: AnalyticsPeriod; metric?: string }) {
    const qs = new URLSearchParams();
    if (params?.period) qs.set('period', params.period);
    if (params?.metric) qs.set('metric', params.metric);
    const tail = qs.size ? `?${qs}` : '';
    return this.client.request<{ success: boolean; data: MetricRollup[] }>(
      'GET', `/api/v1/analytics${tail}`, undefined, { auth: 'apikey' },
    );
  }
}
