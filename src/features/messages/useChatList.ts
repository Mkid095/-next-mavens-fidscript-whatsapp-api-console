import { useCallback, useEffect, useRef, useState } from 'react';
import { dataEvents } from '../../data';
import { messagesApi, type ChatListItem } from './messagesApi';
import { scheduleRefresh } from './useSharedRefreshGate';

// Live chat list for one instance. Real-time SSE events update the list
// optimistically (unread counter increments) without a full refresh, keeping
// the UI instant. Periodic background refresh + focus-refresh keep it accurate.
export function useChatList(instanceName: string | null, activeJid: string | null = null) {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep activeJid in a ref so event handlers don't need it in their deps
  const activeJidRef = useRef<string | null>(null);
  activeJidRef.current = activeJid;

  const refresh = useCallback(async () => {
    if (!instanceName) { setChats([]); return; }
    setLoading(true);
    setError(null);
    const res = await messagesApi.getChats(instanceName);
    setLoading(false);
    if (res.success && res.data) { setChats(res.data.chats); return; }
    setError(res.error || 'Failed to load chats');
  }, [instanceName]);

  // Initial load
  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!instanceName) return;

    // Real-time incoming message: optimistically increment unread for the
    // target chat unless it is the chat the user currently has open.
    // No network request needed — we update local state instantly.
    const offSSE = dataEvents.on('message.received', (e) => {
      const payload = e.payload as { id?: string; chatId?: string; fromNumber?: string; fromName?: string; messageType?: string; content?: string; mediaUrl?: string | null; timestamp?: string };
      const chatId = payload.chatId;
      if (!chatId) return;
      // If this message is for the chat we have open, don't increment the
      // counter — the message will appear in the thread directly.
      if (chatId === activeJidRef.current) return;
      setChats((prev) =>
        prev.map((c) => c.jid === chatId ? { ...c, unread: c.unread + 1 } : c),
      );
    });

    // message.read: emitted when we mark a chat as read (via mark-read endpoint
    // which now also syncs to WhatsApp). Zero-out the unread counter for that chat.
    const offRead = dataEvents.on('message.read', (e) => {
      const { chatId } = (e.payload as { chatId?: string });
      if (!chatId) return;
      setChats((prev) =>
        prev.map((c) => c.jid === chatId ? { ...c, unread: 0 } : c),
      );
    });

    // Other events (e.g. chat list changed, presence) — do a background refresh
    // through the throttle so we eventually sync back to ground truth.
    const offWild = dataEvents.on('*', () => scheduleRefresh(() => { void refresh(); }));

    const onFocus = () => scheduleRefresh(() => { void refresh(); });
    window.addEventListener('focus', onFocus);
    const poll = setInterval(() => scheduleRefresh(() => { void refresh(); }), 30000);

    return () => {
      offSSE();
      offRead();
      offWild();
      window.removeEventListener('focus', onFocus);
      clearInterval(poll);
    };
  }, [instanceName, refresh]);

  return { chats, loading, error, refresh };
}
