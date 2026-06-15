import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../api/platform.js';
import type { FlowDetail, FlowSummary, FlowNodeInput, FlowEdgeInput } from '../api/platform.js';

export function useFlows() {
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await platformApi.listFlows();
    if (res.success && res.data) setFlows(res.data);
    else setError(res.error ?? 'Failed to load flows');
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (body: { name: string; trigger_event?: string; nodes?: FlowNodeInput[]; edges?: FlowEdgeInput[] }) => {
    const res = await platformApi.createFlow(body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const update = useCallback(async (id: string, body: Parameters<typeof platformApi.updateFlow>[1]) => {
    const res = await platformApi.updateFlow(id, body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await platformApi.deleteFlow(id);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  return { flows, loading, error, refresh, create, update, remove };
}

export function useFlow(id: string | null) {
  const [flow, setFlow] = useState<FlowDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) { setFlow(null); return; }
    setLoading(true); setError(null);
    const res = await platformApi.getFlow(id);
    if (res.success && res.data) setFlow(res.data);
    else setError(res.error ?? 'Failed to load flow');
    setLoading(false);
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  return { flow, loading, error, refresh, setFlow };
}
