import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../../api/platform.js';

export interface NoteRow {
  id: string;
  body: string;
  created_at: string;
  author_user_id: string | null;
  author_name: string | null;
}

// Customer notes CRUD hook. Author/created_at come from the server.
export function useNotes(customerId: string | null) {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!customerId) { setNotes([]); return; }
    setLoading(true); setError(null);
    const res = await platformApi.listNotes(customerId);
    if (res.success && res.data) setNotes(res.data);
    else setError(res.error ?? 'Failed to load notes');
    setLoading(false);
  }, [customerId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (body: string) => {
    if (!customerId) return null;
    const trimmed = body.trim();
    if (!trimmed) return null;
    const res = await platformApi.addNote(customerId, trimmed);
    if (res.success && res.data) {
      const row: NoteRow = { id: res.data.id, body: res.data.body, created_at: res.data.created_at, author_user_id: null, author_name: 'You' };
      setNotes(prev => [row, ...prev]);
      return row;
    }
    return null;
  }, [customerId]);

  const remove = useCallback(async (noteId: string) => {
    if (!customerId) return;
    const before = notes;
    setNotes(prev => prev.filter(n => n.id !== noteId));
    const res = await platformApi.removeNote(customerId, noteId);
    if (!res.success) setNotes(before);
  }, [customerId, notes]);

  return { notes, loading, error, refresh, add, remove };
}
