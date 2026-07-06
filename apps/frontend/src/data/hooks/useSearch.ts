// =============================================================================
// useSearch — universal search hook (§8) for Command-K.
// Debounced; returns grouped hits across customers/messages/orders/etc.
// =============================================================================

import { useEffect, useMemo, useState } from 'react';
import { platformApi } from '../api/platform.js';
import type { SearchHit } from '../api/platform.js';

export interface UseSearchResult {
  hits: SearchHit[];
  grouped: Record<string, SearchHit[]>;
  loading: boolean;
  error: string | null;
}

export function useSearch(query: string, types?: string[], debounceMs = 250): UseSearchResult {
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setHits([]); setLoading(false); setError(null); return; }

    setLoading(true);
    const handle = setTimeout(() => {
      platformApi.search(q, types).then((res) => {
        if (res.success && res.data) { setHits(res.data); setError(null); }
        else setError(res.error || 'Search failed');
        setLoading(false);
      });
    }, debounceMs);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, types?.join(','), debounceMs]);

  const grouped = useMemo(() => {
    const out: Record<string, SearchHit[]> = {};
    hits.forEach((h) => { (out[h.entityType] ??= []).push(h); });
    return out;
  }, [hits]);

  return { hits, grouped, loading, error };
}
