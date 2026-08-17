import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../../api/platform.js';
import type { Segment, SegmentFilter, SegmentPreview } from '../../api/platform.js';

// Workspace-scoped saved segments hook. Returns list + CRUD + a preview
// helper that hits POST /api/platform/segments/preview-adhoc (no save).
export function useSegments() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await platformApi.listSegments();
    if (res.success && res.data) setSegments(res.data);
    else setError(res.error ?? 'Failed to load segments');
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (body: { name: string; description?: string; filter: SegmentFilter }) => {
    const res = await platformApi.createSegment(body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const update = useCallback(async (id: string, body: Partial<{ name: string; description: string; filter: SegmentFilter }>) => {
    const res = await platformApi.updateSegment(id, body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await platformApi.deleteSegment(id);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const preview = useCallback(async (id: string) => platformApi.previewSegment(id), []);
  const previewAdhoc = useCallback(async (filter: SegmentFilter) => platformApi.previewAdhocSegment(filter), []);

  return { segments, loading, error, refresh, create, update, remove, preview, previewAdhoc };
}

// Preview hook - runs the resolver on the current filter. Returns null when idle.
export function useSegmentPreview() {
  const [preview, setPreview] = useState<SegmentPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (filter: SegmentFilter) => {
    setLoading(true); setError(null);
    const res = await platformApi.previewAdhocSegment(filter);
    if (res.success && res.data) setPreview(res.data);
    else setError(res.error ?? 'Preview failed');
    setLoading(false);
    return res;
  }, []);

  const reset = useCallback(() => setPreview(null), []);

  return { preview, loading, error, run, reset };
}
