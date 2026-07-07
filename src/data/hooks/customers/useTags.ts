import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../../api/platform.js';

export interface TagRow { id: string; tag: string; created_at: string; }

// Manages the tag list for one customer. Adds/optimistically prepends on add,
// removes on delete. Refresh on mount.
export function useTags(customerId: string | null) {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!customerId) { setTags([]); return; }
    setLoading(true); setError(null);
    const res = await platformApi.listTags(customerId);
    if (res.success && res.data) setTags(res.data);
    else setError(res.error ?? 'Failed to load tags');
    setLoading(false);
  }, [customerId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (tag: string) => {
    if (!customerId) return;
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (tags.some(t => t.tag === trimmed)) return;
    const res = await platformApi.addTag(customerId, trimmed);
    if (res.success && res.data) {
      setTags(prev => [{ id: res.data!.id, tag: res.data!.tag, created_at: new Date().toISOString() }, ...prev]);
    }
  }, [customerId, tags]);

  const remove = useCallback(async (tag: string) => {
    if (!customerId) return;
    const before = tags;
    setTags(prev => prev.filter(t => t.tag !== tag));
    const res = await platformApi.removeTag(customerId, tag);
    if (!res.success) setTags(before);
  }, [customerId, tags]);

  return { tags, loading, error, refresh, add, remove };
}
