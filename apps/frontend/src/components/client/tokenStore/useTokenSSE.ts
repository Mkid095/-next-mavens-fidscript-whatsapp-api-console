import { useEffect } from 'react';

interface UseTokenSSEOptions {
  onBalance: (balance: number) => void;
  onPendingConfirmed: () => void;
  hasPending: boolean;
}

/**
 * Subscribes to /api/sse/client and listens for `tokenUpdate` events.
 * - On every valid `balance` update, calls `onBalance`
 * - If a payment is pending when the update arrives, calls `onPendingConfirmed`
 */
export function useTokenSSE({ onBalance, onPendingConfirmed, hasPending }: UseTokenSSEOptions) {
  useEffect(() => {
    const token = localStorage.getItem('fidscript_client_token');
    if (!token) return;

    const es = new EventSource(`/api/sse/client?token=${encodeURIComponent(token)}`);

    const handleTokenUpdate = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (typeof data.balance === 'number' && data.balance >= 0) {
          onBalance(data.balance);
          if (hasPending) onPendingConfirmed();
        }
      } catch {}
    };

    const handleError = () => {
      // EventSource will auto-reconnect
    };

    es.addEventListener('tokenUpdate', handleTokenUpdate);
    es.addEventListener('error', handleError);

    return () => {
      es.removeEventListener('tokenUpdate', handleTokenUpdate);
      es.removeEventListener('error', handleError);
      es.close();
    };
  }, [onBalance, onPendingConfirmed, hasPending]);
}
