/**
 * React Query singleton. Exported as a singleton so SSE handlers (which live
 * outside the React tree) can call queryClient.invalidateQueries() to
 * propagate real-time events into the React Query cache.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on every focus - we handle that via SSE invalidation
      // which is faster and avoids unnecessary requests.
      // staleTime: 60s means data is "fresh" for 60s before a background
      // refetch is even considered on the next component mount.
      staleTime: 60_000,
      retry: 2,
    },
  },
});
