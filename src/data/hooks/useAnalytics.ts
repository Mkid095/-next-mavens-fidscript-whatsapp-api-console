// =============================================================================
// useAnalytics — metric rollups overview (§13) for dashboard surfaces.
// Returns the per-metric sums for the current day, refreshed on events.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../api/platform.js';
import { useDataEvent } from './useDataEvent.js';

interface UseAnalyticsState {
  metrics: Record<string, number>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAnalyticsOverview(): UseAnalyticsState {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messageEvent = useDataEvent('message.received');
  const sentEvent = useDataEvent('message.sent');

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await platformApi.analyticsOverview();
    if (res.success && res.data) { setMetrics(res.data); setError(null); }
    else setError(res.error || 'Failed to load analytics');
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Message activity changes the counts — refresh
  useEffect(() => {
    if (messageEvent || sentEvent) {
      const t = setTimeout(refresh, 500); // small delay so the rollup commits first
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageEvent, sentEvent]);

  return { metrics, loading, error, refresh };
}
