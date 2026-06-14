import { useCallback, useRef, useState } from 'react';
import { instancesApi } from '../../../services/api';
import type { Instance } from '../../../services/api';

export function useConnectionPolling(
  instances: Instance[],
  onInstancesChange: (instances: Instance[]) => void
) {
  const [connectionCheckInterval, setConnectionCheckInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(
    (pairingInstance: Instance, onComplete: () => void) => {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
      const interval = setInterval(async () => {
        try {
          const res = await instancesApi.getConnectionState(pairingInstance.name);
          if (res.success && res.data) {
            const data = res.data;
            if (data.status === 'connected') {
              clearInterval(interval);
              setConnectionCheckInterval(null);
              const updated = instances.map(i =>
                i.id === pairingInstance.id
                  ? { ...i, status: 'connected' as const, phone_number: data.phone_number || i.phone_number }
                  : i
              );
              onInstancesChange(updated);
              onComplete();
            } else if (data.status === 'disconnected' || data.status === 'error') {
              clearInterval(interval);
              setConnectionCheckInterval(null);
            }
          }
        } catch {
          // keep polling
        }
      }, 3000);
      setConnectionCheckInterval(interval);
    },
    [instances, onInstancesChange, connectionCheckInterval]
  );

  const stopPolling = useCallback(() => {
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
      setConnectionCheckInterval(null);
    }
  }, [connectionCheckInterval]);

  return { startPolling, stopPolling };
}
