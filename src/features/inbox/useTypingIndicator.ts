import { useEffect, useState } from 'react';

// Listens to the ephemeral `sse-presence` window event (from useInstanceSSE)
// and reports whether the other party in `chatId` is typing. Auto-clears after
// a few seconds of silence so a dropped presence event doesn't stick.
export function useTypingIndicator(chatId: string | null): boolean {
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!chatId) { setTyping(false); return; }
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { chatId: string; presence: string };
      if (detail.chatId !== chatId) return;
      if (detail.presence === 'composing' || detail.presence === 'recording') {
        setTyping(true);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setTyping(false), 4000);
      } else {
        setTyping(false);
      }
    };

    window.addEventListener('sse-presence', handler);
    return () => {
      window.removeEventListener('sse-presence', handler);
      if (timer) clearTimeout(timer);
    };
  }, [chatId]);

  return typing;
}
