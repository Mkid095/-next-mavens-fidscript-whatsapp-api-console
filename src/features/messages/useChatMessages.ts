import { useCallback, useEffect, useRef, useState } from 'react';
import { dataEvents } from '../../data';
import { messagesApi, type MirrorMessage } from './messagesApi';
import { scheduleRefresh } from './useSharedRefreshGate';

/** Client-side cache keyed by "instanceName|jid" so chat switches are instant. */
const messageCache = new Map<string, MirrorMessage[]>();

// Live thread for one (instance, jid). Chat switching clears the thread
// immediately and either shows cached messages or fetches fresh ones.
export function useChatMessages(instanceName: string | null, jid: string | null) {
  const [messages, setMessages] = useState<MirrorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track the previous jid so we can clear messages immediately on chat switch
  const prevJidRef = useRef<string | null>(null);

  const cacheKey = instanceName && jid ? `${instanceName}|${jid}` : null;

  const refresh = useCallback(async () => {
    if (!instanceName || !jid) { setMessages([]); return; }
    setLoading(true);
    setError(null);
    const res = await messagesApi.getThread(instanceName, jid);
    setLoading(false);
    if (res.success && res.data) {
      const msgs = res.data.messages;
      if (cacheKey) messageCache.set(cacheKey, msgs);
      setMessages(msgs);
      return;
    }
    setError(res.error || 'Failed to load messages');
  }, [instanceName, jid, cacheKey]);

  // Chat switch: when jid changes, clear messages immediately so old chat's
  // history never bleeds into the new chat, even briefly.
  useEffect(() => {
    const prevJid = prevJidRef.current;
    prevJidRef.current = jid;

    if (!instanceName || !jid) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // If jid changed (chat switch), clear messages immediately before loading
    if (prevJid !== null && prevJid !== jid) {
      setMessages([]);
      setLoading(true);
    }

    const ck = cacheKey;
    const cached = ck ? messageCache.get(ck) : undefined;

    if (cached) {
      setMessages(cached);
      void refresh();
    } else {
      void refresh();
    }
  // refresh is stable for the same [instanceName, jid] pair via useCallback
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
