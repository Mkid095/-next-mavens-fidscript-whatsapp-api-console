import { useEffect } from 'react';

export function useSseTokens(setTokenBalance: (balance: number) => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const data = (e as CustomEvent).detail as { balance: number };
      setTokenBalance(data.balance);
    };
    window.addEventListener('sse-token-update', handler);
    return () => window.removeEventListener('sse-token-update', handler);
  }, [setTokenBalance]);
}
