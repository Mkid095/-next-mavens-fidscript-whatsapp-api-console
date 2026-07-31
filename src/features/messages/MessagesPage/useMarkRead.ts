import { useEffect, useRef } from 'react';
import { messagesApi } from '../messagesApi';
import type { ChatListItem } from '../messagesApi';

export function useMarkRead(
  instanceName: string | undefined,
  selectedJid: string | null,
  chats: ChatListItem[],
) {
  const prevUnreadRef = useRef(0);

  useEffect(() => {
    if (!instanceName || !selectedJid) return;
    if (prevUnreadRef.current > 0) {
      messagesApi.markRead(instanceName, selectedJid).catch(() => { /* non-critical */ });
    }
    const chat = chats.find((c) => c.jid === selectedJid);
    prevUnreadRef.current = chat?.unread ?? 0;
  }, [instanceName, selectedJid, chats]);
}
