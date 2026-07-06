import { useCallback } from 'react';

interface ReactionTarget { messageId: string; position: { x: number; y: number }; }

export function useMessageLongPress(onTrigger: (msgId: string, x: number, y: number) => void) {
  const handleTouchStart = useCallback((e: React.TouchEvent, msgId: string) => {
    const timer = setTimeout(() => {
      const touch = e.touches[0];
      onTrigger(msgId, touch.clientX, touch.clientY);
    }, 500);
    (e.currentTarget as HTMLElement).dataset.longPressTimer = String(timer);
  }, [onTrigger]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const timer = (e.currentTarget as HTMLElement).dataset.longPressTimer;
    if (timer) { clearTimeout(parseInt(timer)); delete (e.currentTarget as HTMLElement).dataset.longPressTimer; }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const el = e.currentTarget as HTMLElement;
    const timer = el.dataset.longPressTimer;
    if (timer) { clearTimeout(parseInt(timer)); delete el.dataset.longPressTimer; }
  }, []);

  return { handleTouchStart, handleTouchEnd, handleTouchMove };
}
