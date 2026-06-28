import { useCallback, useEffect, useRef, useState } from 'react';
import { dataEvents } from '../../data';
import { messagesApi, type MirrorMessage } from './messagesApi';
import { scheduleRefresh } from './useSharedRefreshGate';

// Live thread for one (instance, jid). Incoming SSE messages for the open
// conversation are appended directly (no API round-trip). All other events
// go through the shared throttle gate (10/sec backend cap).
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

  // Reset when conversation changes
  useEffect(() => { void refresh(); }, [refresh]);

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
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
    });
    return off;
  }, [jid]);

  const optimisticAppend = useCallback((msg: MirrorMessage) => {
    setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
  }, []);

  return { messages, loading, error, refresh, optimisticAppend };
}