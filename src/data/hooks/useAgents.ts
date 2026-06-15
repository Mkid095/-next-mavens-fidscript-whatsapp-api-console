import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../api/platform.js';
import type { Agent } from '../api/platform.js';

// Workspace-scoped agent registry hook. Loads the agent list + the
// append-only action catalog; exposes CRUD that refreshes the list.
export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [catalog, setCatalog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await platformApi.listAgents();
    if (res.success && res.data) { setAgents(res.data.agents); setCatalog(res.data.action_catalog); }
    else setError(res.error ?? 'Failed to load agents');
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (body: Partial<Agent> & { name: string }) => {
    const res = await platformApi.createAgent(body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const update = useCallback(async (id: string, body: Partial<Agent>) => {
    const res = await platformApi.updateAgent(id, body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await platformApi.deleteAgent(id);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  return { agents, catalog, loading, error, refresh, create, update, remove };
}

export function useAgentPermissions(agentId: string | null) {
  const [granted, setGranted] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!agentId) { setGranted([]); return; }
    setLoading(true);
    const res = await platformApi.getAgentPermissions(agentId);
    if (res.success && res.data) { setGranted(res.data.granted); setCatalog(res.data.catalog); }
    setLoading(false);
  }, [agentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const grant = useCallback(async (action: string) => {
    if (!agentId) return;
    await platformApi.grantAgentPermission(agentId, action);
    await refresh();
  }, [agentId, refresh]);

  const revoke = useCallback(async (action: string) => {
    if (!agentId) return;
    await platformApi.revokeAgentPermission(agentId, action);
    setGranted(prev => prev.filter(a => a !== action));
  }, [agentId]);

  return { granted, catalog, loading, refresh, grant, revoke };
}
