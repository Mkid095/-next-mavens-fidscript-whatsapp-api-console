import { useCallback, useEffect, useState } from 'react';
import { dataEvents } from '../../data';
import { messagesApi, type ChatListItem } from './messagesApi';
import { scheduleRefresh } from './useSharedRefreshGate';

// Live chat list for one instance. SSE-driven refreshes are coalesced + rate-
// limited through the shared gate (10/sec backend cap, but the frontend
// debounces SSE bursts to avoid hammering the gateway on message storms).
export function useChatList(instanceName: string | null) {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!instanceName) { setChats([]); return; }
    setLoading(true);
    setError(null);
    const res = await messagesApi.getChats(instanceName);
    setLoading(false);
    if (res.success && res.data) { setChats(res.data.chats); return; }
    setError(res.error || 'Failed to load chats');
  }, [instanceName]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!instanceName) return;
    // SSE-driven refreshes bypass the throttle — we want real-time updates for incoming messages
    const offSSE = dataEvents.on('message.received', () => { void refresh(); });
    // Wildcard catches other events; these go through the throttle
    const offWild = dataEvents.on('*', () => scheduleRefresh(() => { void refresh(); }));
    // Real-time AI override changes from SSE — update the matching chat without a full refresh
    const offOverride = dataEvents.on('ai.override_changed', (e) => {
      const { chatId, mode } = e.payload as { chatId: string; mode: 'ai' | 'manual' };
      setChats((prev) => prev.map((c) => c.jid === chatId ? { ...c, aiMode: mode } : c));
    });
    const onFocus = () => scheduleRefresh(() => { void refresh(); });
    window.addEventListener('focus', onFocus);
    const poll = setInterval(() => scheduleRefresh(() => { void refresh(); }), 30000);
    return () => { offSSE(); offWild(); offOverride(); window.removeEventListener('focus', onFocus); clearInterval(poll); };
  }, [instanceName, refresh]);

  return { chats, loading, error, refresh };
}