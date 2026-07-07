import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../../api/platform.js';

export interface TeamRow { id: string; name: string; created_at: string; member_count: number; }
export interface TeamMember { id: string; user_id: string; joined_at: string; email: string | null; name: string | null; }

// Teams list hook (workspace-scoped). CRUD operations mutate the local list
// optimistically and fall back to a server refresh on failure.
export function useTeams() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await platformApi.listTeams();
    if (res.success && res.data) setTeams(res.data);
    else setError(res.error ?? 'Failed to load teams');
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (name: string) => {
    const res = await platformApi.createTeam(name);
    if (res.success && res.data) {
      setTeams(prev => [...prev, { id: res.data!.id, name: res.data!.name, created_at: new Date().toISOString(), member_count: 0 }]);
    }
    return res;
  }, []);

  const rename = useCallback(async (id: string, name: string) => {
    const before = teams;
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t));
    const res = await platformApi.renameTeam(id, name);
    if (!res.success) setTeams(before);
  }, [teams]);

  const remove = useCallback(async (id: string) => {
    const before = teams;
    setTeams(prev => prev.filter(t => t.id !== id));
    const res = await platformApi.deleteTeam(id);
    if (!res.success) setTeams(before);
  }, [teams]);

  return { teams, loading, error, refresh, create, rename, remove };
}

// Per-team members list. Lazily fetched when a teamId is supplied.
export function useTeamMembers(teamId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!teamId) { setMembers([]); return; }
    setLoading(true);
    const res = await platformApi.listTeamMembers(teamId);
    if (res.success && res.data) setMembers(res.data);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (userId: string) => {
    if (!teamId) return;
    await platformApi.addTeamMember(teamId, userId);
    await refresh();
  }, [teamId, refresh]);

  const remove = useCallback(async (userId: string) => {
    if (!teamId) return;
    await platformApi.removeTeamMember(teamId, userId);
    setMembers(prev => prev.filter(m => m.user_id !== userId));
  }, [teamId]);

  return { members, loading, refresh, add, remove };
}
