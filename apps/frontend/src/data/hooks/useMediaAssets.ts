import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../api/platform.js';
import type { MediaAsset, MediaKind } from '../api/platform.js';

// Workspace-scoped media library hook. Loads the asset list, exposes filters
// (kind / tag / q) and CRUD. Used by both the MediaLibrary tab and the
// MediaPicker modal.
export function useMediaAssets(initialFilter?: { kind?: MediaKind }) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [kind, setKind] = useState<MediaKind | ''>(initialFilter?.kind || '');
  const [tag, setTag] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await platformApi.listMedia({
      kind: kind || undefined,
      tag: tag || undefined,
      q: q || undefined,
    });
    if (res.success && res.data) setAssets(res.data);
    else setError(res.error ?? 'Failed to load media');
    setLoading(false);
  }, [kind, tag, q]);

  useEffect(() => { refresh(); }, [refresh]);

  const upload = useCallback(async (body: { url?: string; image?: string; name?: string; mime?: string; tags?: string[] }) => {
    const res = await platformApi.createMedia(body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const update = useCallback(async (id: string, body: { name?: string; tags?: string[] }) => {
    const res = await platformApi.updateMedia(id, body);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await platformApi.deleteMedia(id);
    if (res.success) await refresh();
    return res;
  }, [refresh]);

  // All unique tags across loaded assets (for the filter dropdown).
  const allTags = Array.from(new Set(assets.flatMap(a => a.tags))).sort();

  return { assets, kind, setKind, tag, setTag, q, setQ, allTags, loading, error, refresh, upload, update, remove };
}
