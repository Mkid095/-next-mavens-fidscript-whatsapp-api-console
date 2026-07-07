/**
 * useAnalytics.ts — data fetching hook for the analytics dashboard.
 */
import { useState, useEffect, useCallback } from 'react';
import { platformApi } from '../../data/api/index.js';

export interface MetricRow {
  metric_type: string;
  entity_type: string | null;
  period: string;
  period_start: string;
  value: number;
  extra: string | null;
}

export interface AnalyticsOverview {
  [metric: string]: number;
}

export function useAnalyticsOverview() {
  const [data, setData] = useState<AnalyticsOverview>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await platformApi.analyticsOverview();
      if (res.success && res.data) setData(res.data);
      else setError(res.error ?? 'Failed to load');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useAnalyticsHistory(params?: { period?: string; metric?: string }) {
  const [data, setData] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await platformApi.analyticsQuery(params);
      if (res.success && res.data) setData(res.data);
      else setError(res.error ?? 'Failed to load');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [params?.period, params?.metric]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}
