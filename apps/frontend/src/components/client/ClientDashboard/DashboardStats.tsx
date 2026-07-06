import { useState, useEffect } from 'react';

export interface DashboardStatsState {
  previousBalance: number | undefined;
}

export function useDashboardStats(
  tokenBalance: number,
  onTokenBalanceChange: (balance: number) => void,
) {
  const [previousBalance, setPreviousBalance] = useState<number | undefined>();

  const handleTokenDeduct = (amount: number) => {
    setPreviousBalance(tokenBalance);
    onTokenBalanceChange(Math.max(0, tokenBalance - amount));
  };

  // Clear previousBalance when tokenBalance is updated from SSE (real-time sync)
  useEffect(() => {
    setPreviousBalance(undefined);
  }, [tokenBalance]);

  return { previousBalance, handleTokenDeduct };
}
