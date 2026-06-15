import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../api/platform.js';

export interface SLAPolicy {
  id: string;
  name: string;
  channel: string | null;
  priority: string | null;
  first_response_minutes: number;
  resolution_minutes: number;
  created_at: string;
}

// Workspace-scoped SLA policy CRUD. Used by the SLA editor settings panel.
export function useSLAPolicies() {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await platformApi.listSLAPolicies();
    if (res.success && res.data) setPolicies(res.data);
    else setError(res.error ?? 'Failed to load SLA policies');
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (body: {
    name: string; channel?: string | null; priority?: string | null;
    first_response_minutes?: number; resolution_minutes?: number;
  }) => {
    const res = await platformApi.createSLAPolicy(body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const update = useCallback(async (id: string, body: Partial<SLAPolicy>) => {
    const res = await platformApi.updateSLAPolicy(id, body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await platformApi.deleteSLAPolicy(id);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  return { policies, loading, error, refresh, create, update, remove };
}
