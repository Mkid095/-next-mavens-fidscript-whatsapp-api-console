import { useCallback, useEffect, useState } from 'react';
import { useDataEvents } from '../shared/useDataEvent.js';
import { platformApi, type StatusPost, type CreateStatusPostInput } from '../../api/platform.js';

interface UseStatusPostsReturn {
  posts: StatusPost[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (body: CreateStatusPostInput) => Promise<StatusPost>;
  update: (id: string, body: Partial<CreateStatusPostInput>) => Promise<StatusPost>;
  remove: (id: string) => Promise<void>;
  schedule: (id: string, scheduled_at: string) => Promise<StatusPost>;
  cancel: (id: string) => Promise<StatusPost>;
  postNow: (id: string) => Promise<StatusPost>;
}

/**
 * Phase 5 Slice E - Status posts list hook.
 * Polls /api/campaigns/statuses on mount and re-pulls on any status.* event
 * (the server doesn't currently publish those on the bus - the hook uses a
 * manual refresh + a coarse 30s poll as the safety net).
 */
export function useStatusPosts(): UseStatusPostsReturn {
  const [posts, setPosts] = useState<StatusPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await platformApi.listStatusPosts();
    if (res.success && res.data) {
      setPosts(res.data);
      setError(null);
    } else {
      setError(res.error || 'Failed to load status posts');
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  // Light polling: statuses can transition to posted/failed while idle
  useEffect(() => {
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [refresh]);
  // Re-pull on conversation/message events that may correlate with status posts.
  useDataEvents(['message.delivered', 'connection.state_change'], () => { refresh().catch(() => { /* swallow */ }); });

  const create = useCallback(async (body: CreateStatusPostInput): Promise<StatusPost> => {
    const res = await platformApi.createStatusPost(body);
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to create status post');
    await refresh();
    return res.data;
  }, [refresh]);

  const update = useCallback(async (id: string, body: Partial<CreateStatusPostInput>): Promise<StatusPost> => {
    const res = await platformApi.updateStatusPost(id, body);
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to update status post');
    await refresh();
    return res.data;
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<void> => {
    const res = await platformApi.deleteStatusPost(id);
    if (!res.success) throw new Error(res.error || 'Failed to delete status post');
    await refresh();
  }, [refresh]);

  const schedule = useCallback(async (id: string, scheduled_at: string): Promise<StatusPost> => {
    const res = await platformApi.scheduleStatusPost(id, scheduled_at);
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to schedule status post');
    await refresh();
    return res.data;
  }, [refresh]);

  const cancel = useCallback(async (id: string): Promise<StatusPost> => {
    const res = await platformApi.cancelStatusPost(id);
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to cancel status post');
    await refresh();
    return res.data;
  }, [refresh]);

  const postNow = useCallback(async (id: string): Promise<StatusPost> => {
    const res = await platformApi.postStatusNow(id);
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to post status');
    await refresh();
    return res.data;
  }, [refresh]);

  return { posts, loading, error, refresh, create, update, remove, schedule, cancel, postNow };
}
