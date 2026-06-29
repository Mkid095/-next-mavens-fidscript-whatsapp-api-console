import { useCallback, useEffect, useRef, useState } from 'react';
import { dataEvents } from '../../data';
import { messagesApi, type MirrorMessage } from './messagesApi';
import { scheduleRefresh } from './useSharedRefreshGate';

/** Client-side cache keyed by "instanceName|jid" so chat switches are instant. */
const messageCache = new Map<string, MirrorMessage[]>();

// Live thread for one (instance, jid). Chat switching is served from a
// client-side cache (instant) while a background refresh keeps it fresh.
// All other events go through the shared throttle gate (10/sec backend cap).
export function useChatMessages(instanceName: string | null, jid: string | null) {
  const [messages, setMessages] = useState<MirrorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  const cacheKey = instanceName && jid ? `${instanceName}|${jid}` : null;

  const refresh = useCallback(async () => {
    if (!instanceName || !jid) { setMessages([]); return; }
    setLoading(true);
    setError(null);
    const res = await messagesApi.getThread(instanceName, jid);
    setLoading(false);
    if (res.success && res.data) {
      const msgs = res.data.messages;
      // Always update cache on successful fetch
      if (cacheKey) messageCache.set(cacheKey, msgs);
      setMessages(msgs);
      return;
    }
    setError(res.error || 'Failed to load messages');
  }, [instanceName, jid, cacheKey]);

  // Switch chats: serve from cache immediately, then refresh in background
  useEffect(() => {
    if (!instanceName || !jid) { setMessages([]); return; }

    const cached = cacheKey ? messageCache.get(cacheKey) : undefined;

    if (isFirstRender.current) {
      // First mount: use cache if available, otherwise load from network
      isFirstRender.current = false;
      if (cached) {
        setMessages(cached);
        // Fetch fresh data in background
        void refresh();
        return;
      } else {
        void refresh();
        return;
      }
    }

    if (cached) {
      // Subsequent chat switches: show cached immediately, refresh in background
      setMessages(cached);
      void refresh();
    } else {
      void refresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceName, jid]);

  // Wildcard events go through the throttle (state changes, etc.)
  useEffect(() => {
    if (!instanceName || !jid) return;
    const off = dataEvents.on('*', () => scheduleRefresh(() => { void refresh(); }));
    return off;
  }, [instanceName, jid, refresh]);

  // Real-time: direct append for incoming messages in the open conversation
  useEffect(() => {
    if (!jid) return;
    const off = dataEvents.on('message.received', (event) => {
      const payload = event.payload as { chatId?: string; fromNumber?: string; fromName?: string; messageType?: string; content?: string; mediaUrl?: string | null; timestamp?: string };
      // Only handle messages for the open conversation
      if (payload.chatId !== jid && payload.chatId !== ` ${jid}`) return;
      const msg: MirrorMessage = {
        id: `sse_${Date.now()}`,
        direction: 'incoming',
        type: payload.messageType || 'text',
        content: payload.content || '',
        mediaUrl: payload.mediaUrl || null,
        mediaMimetype: null,
        senderName: payload.fromName || null,
        timestamp: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const next = [...prev, msg];
        if (cacheKey) messageCache.set(cacheKey, next);
        return next;
      });
    });
    return off;
  }, [jid, cacheKey]);

  const optimisticAppend = useCallback((msg: MirrorMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      const next = [...prev, msg];
      if (cacheKey) messageCache.set(cacheKey, next);
      return next;
    });
  }, [cacheKey]);

  return { messages, loading, error, refresh, optimisticAppend };
}
