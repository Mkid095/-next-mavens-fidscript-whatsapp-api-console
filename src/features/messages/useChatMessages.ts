import { useCallback, useEffect, useState } from 'react';
import { dataEvents } from '../../data';
import { messagesApi, type MirrorMessage } from './messagesApi';

// Live thread for one (instance, jid). Refreshes on SSE events. Exposes
// optimisticAppend so the composer can show the outgoing bubble instantly;
// the refresh reconciles with Evolution (dedup by id) so the echo replaces it.
export function useChatMessages(instanceName: string | null, jid: string | null) {
  const [messages, setMessages] = useState<MirrorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!instanceName || !jid) { setMessages([]); return; }
    setLoading(true);
    setError(null);
    const res = await messagesApi.getThread(instanceName, jid);
    setLoading(false);
    if (res.success && res.data) { setMessages(res.data.messages); return; }
    setError(res.error || 'Failed to load messages');
  }, [instanceName, jid]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!instanceName || !jid) return;
    const off = dataEvents.on('*', () => { void refresh(); });
    return off;
  }, [instanceName, jid, refresh]);

  const optimisticAppend = useCallback((msg: MirrorMessage) => {
    setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
  }, []);

  return { messages, loading, error, refresh, optimisticAppend };
}
