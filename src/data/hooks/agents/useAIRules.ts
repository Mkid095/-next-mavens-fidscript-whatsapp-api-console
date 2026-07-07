import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../../api/platform.js';
import type { AIRule } from '../../api/platform.js';

// Phase 4 — keyword rule list (the simple form of the AI inbound pipeline).
export function useAIRules() {
  const [rules, setRules] = useState<AIRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await platformApi.listAIRules();
    if (res.success && res.data) setRules(res.data);
    else setError(res.error ?? 'Failed to load rules');
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (body: Parameters<typeof platformApi.createAIRule>[0]) => {
    const res = await platformApi.createAIRule(body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const update = useCallback(async (id: string, body: Partial<AIRule>) => {
    const res = await platformApi.updateAIRule(id, body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await platformApi.deleteAIRule(id);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  return { rules, loading, error, refresh, create, update, remove };
}
