import { useCallback, useEffect, useRef } from 'react';
import { instancesApi } from '../../../services/api';
import type { Instance } from '../../../services/api';

/**
 * Polling fallback for connection-state detection - used when a proxy strips
 * SSE mid-flight. Callbacks are stable (refs hold the latest values) so callers
 * can hold them in closures without going stale. startPolling self-clears once a
 * terminal state (connected/disconnected/error) is observed.
 */
export function useConnectionPolling(
  instances: Instance[],
  onInstancesChange: (instances: Instance[]) => void
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const instancesRef = useRef(instances);
  instancesRef.current = instances;
  const onChangeRef = useRef(onInstancesChange);
  onChangeRef.current = onInstancesChange;

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((pairingInstance: Instance, onConnected: () => void) => {
    clear();
    const interval = setInterval(async () => {
      try {
        const res = await instancesApi.getConnectionState(pairingInstance.name);
        if (!res.success || !res.data) return;
        const data = res.data;
        if (data.status === 'connected') {
          clear();
          const updated = instancesRef.current.map(i =>
            i.id === pairingInstance.id
              ? { ...i, status: 'connected' as const, phone_number: data.phone_number || i.phone_number }
              : i
          );
          onChangeRef.current(updated);
          onConnected(); // only close modal on successful connection
        }
        // disconnected/error → keep polling, keep modal open
      } catch {
        // keep polling
      }
    }, 3000);
    intervalRef.current = interval;
  }, [clear]);

  const stopPolling = clear;

  useEffect(() => () => clear(), [clear]);

  return { startPolling, stopPolling };
}
