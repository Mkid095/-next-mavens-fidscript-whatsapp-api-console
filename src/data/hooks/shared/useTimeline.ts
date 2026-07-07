// =============================================================================
// useTimeline — the Customer Timeline (§7), reads domain_events for a customer.
// The killer drawer feature: every event across every subsystem, unified.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../../api/platform.js';
import type { TimelineEvent } from '../../api/platform.js';
import { useDataEvent } from '../shared/useDataEvent.js';

interface UseTimelineState {
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTimeline(customerId: string | null): UseTimelineState {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const anyEvent = useDataEvent('*'); // any domain event might extend the timeline

  const refresh = useCallback(async () => {
    if (!customerId) { setEvents([]); return; }
    setLoading(true);
    const res = await platformApi.getTimeline(customerId);
    if (res.success && res.data) setEvents(res.data);
    else setError(res.error || 'Failed to load timeline');
    setLoading(false);
  }, [customerId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Refresh when a realtime event arrives AND it concerns this customer
  useEffect(() => {
    if (!anyEvent) return;
    const p = anyEvent.payload;
    if (p.customerId === customerId) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyEvent, customerId]);

  return { events, loading, error, refresh };
}
