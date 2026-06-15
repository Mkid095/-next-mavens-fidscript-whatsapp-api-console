import { useState, useCallback, useRef, useEffect } from 'react';
import type { Instance } from '../../../services/api';
import { instancesApi } from '../../../services/api';
import { useConnectionPolling } from './useConnectionPolling';

interface UseInstanceConnectionProps {
  instances: Instance[];
  onInstancesChange: (instances: Instance[]) => void;
}

export function useInstanceConnection({ instances, onInstancesChange }: UseInstanceConnectionProps) {
  const [pairingInstance, setPairingInstance] = useState<Instance | null>(null);
  const [pairingQR, setPairingQR] = useState<string>('');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [regeneratingQR, setRegeneratingQR] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const esRef = useRef<EventSource | null>(null);
  // True once the user explicitly closed the modal — suppresses any cleanup side effects.
  const closingManually = useRef(false);

  // Polling fallback (every 3s) in case a proxy strips the SSE stream.
  const { startPolling, stopPolling } = useConnectionPolling(instances, onInstancesChange);

  useEffect(() => {
    return () => {
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      stopPolling();
    };
  }, [stopPolling]);

  // Tear down both listeners + close the modal once a scan resolves (connected or disconnected).
  const resolvePairing = useCallback(() => {
    stopPolling();
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setPairingInstance(null);
    setPairingQR('');
  }, [stopPolling]);

  /**
   * SSE listener for real-time connection state. The backend emits a NAMED
   * `stateChange` event — `onmessage` never fires for named events, so we must
   * use addEventListener('stateChange'). Polling is wired alongside as a fallback.
   */
  const openSSEConnection = useCallback((inst: Instance) => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    const token = localStorage.getItem('fidscript_client_token');
    if (!token) return;

    closingManually.current = false;
    const es = new EventSource(`/api/sse/instance/${inst.name}?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    const handleStateChange = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as { state: string; phoneNumber: string | null };
        if (data.state === 'connected') {
          // Use the passed inst, not pairingInstance — at call time setState hasn't flushed yet.
          onInstancesChange(instances.map(i =>
            i.id === inst.id
              ? { ...i, status: 'connected' as const, phone_number: data.phoneNumber || i.phone_number }
              : i
          ));
          resolvePairing();
        } else if (data.state === 'disconnected') {
          onInstancesChange(instances.map(i =>
            i.id === inst.id
              ? { ...i, status: 'disconnected' as const, phone_number: null }
              : i
          ));
          resolvePairing();
        }
      } catch {
        // Ignore malformed messages
      }
    };
    es.addEventListener('stateChange', handleStateChange);

    es.onerror = () => {
      // EventSource auto-reconnects on transient errors. Only drop our ref when
      // the stream is truly dead; the polling fallback keeps detection working.
      if (es.readyState === EventSource.CLOSED && !closingManually.current) {
        esRef.current = null;
      }
    };
  }, [instances, onInstancesChange, resolvePairing]);

  // Opens the modal and fetches a fresh QR for the given instance
  const handleConnect = useCallback(async (inst: Instance) => {
    setPairingInstance(inst);
    setConnectionError('');
    setGeneratingQR(true);
    try {
      // Logout first to clear any existing session and get a fresh QR
      await instancesApi.disconnect(inst.name);
      const res = await instancesApi.connect(inst.name);
      if (res.success && res.data) {
        setPairingQR(res.data.qrcode_image || res.data.qrcode || '');
        openSSEConnection(inst);
        startPolling(inst, resolvePairing); // fallback if SSE is stripped
      } else {
        setConnectionError(res.error || 'Failed to generate QR code');
      }
    } catch {
      setConnectionError('Failed to generate QR code');
    }
    setGeneratingQR(false);
  }, [openSSEConnection, startPolling, resolvePairing]);

  // Regenerates a new QR — must logout first to clear the old session, then connect
  const handleRegenerateQR = useCallback(async () => {
    if (!pairingInstance) return;
    setRegeneratingQR(true);
    setConnectionError('');
    try {
      await instancesApi.disconnect(pairingInstance.name);
      const res = await instancesApi.connect(pairingInstance.name);
      if (res.success && res.data) {
        setPairingQR(res.data.qrcode_image || res.data.qrcode || '');
      } else {
        setConnectionError(res.error || 'Failed to regenerate QR code');
      }
    } catch {
      setConnectionError('Failed to regenerate QR code');
    }
    setRegeneratingQR(false);
  }, [pairingInstance]);

  // Manual check — user-initiated fallback when SSE/polling haven't fired
  const handleSimulateSuccessfulScan = useCallback(async () => {
    if (!pairingInstance) return;
    try {
      const res = await instancesApi.getConnectionState(pairingInstance.name);
      if (res.success && res.data && res.data.status === 'connected') {
        onInstancesChange(instances.map(i =>
          i.id === pairingInstance.id
            ? { ...i, status: 'connected' as const, phone_number: res.data.phone_number || i.phone_number }
            : i
        ));
        resolvePairing();
      }
    } catch {
      // Silently fail — SSE/polling will catch the real event
    }
  }, [pairingInstance, instances, onInstancesChange, resolvePairing]);

  const handleDisconnect = useCallback(async (inst: Instance) => {
    try {
      await instancesApi.disconnect(inst.name);
      onInstancesChange(instances.map(i =>
        i.id === inst.id ? { ...i, status: 'disconnected' as const, phone_number: null } : i
      ));
    } catch (err) {
      console.error('Failed to disconnect', err);
    }
  }, [instances, onInstancesChange]);

  const handleDeleteInstance = useCallback(async (inst: Instance) => {
    try {
      await instancesApi.delete(inst.name);
      onInstancesChange(instances.filter(i => i.id !== inst.id));
    } catch (err) {
      console.error('Failed to delete instance', err);
    }
  }, [instances, onInstancesChange]);

  const handleClosePairingModal = useCallback(() => {
    closingManually.current = true;
    resolvePairing();
    setConnectionError('');
  }, [resolvePairing]);

  return {
    pairingInstance,
    pairingQR,
    generatingQR,
    regeneratingQR,
    connectionError,
    handleConnect,
    handleRegenerateQR,
    handleSimulateSuccessfulScan,
    handleDisconnect,
    handleDeleteInstance,
    handleClosePairingModal,
  };
}
