import { useCallback, useEffect, useState } from 'react';
import { dataEvents } from '../../data';
import { messagesApi, type MirrorMessage } from './messagesApi';
import { scheduleRefresh } from './useSharedRefreshGate';

// Live thread for one (instance, jid). SSE-driven refreshes are coalesced
// through the shared gate so message storms don't burst the chat mirror
// (10/sec backend cap; the gate also protects the gateway from thundering-herd
// find-messages calls).
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
    const off = dataEvents.on('*', () => scheduleRefresh(() => { void refresh(); }));
    return off;
  }, [instanceName, jid, refresh]);

  const optimisticAppend = useCallback((msg: MirrorMessage) => {
    setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
  }, []);

  return { messages, loading, error, refresh, optimisticAppend };
}