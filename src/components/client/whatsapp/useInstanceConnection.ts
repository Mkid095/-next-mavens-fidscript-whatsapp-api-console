import { useState, useCallback, useRef, useEffect } from 'react';
import type { Instance } from '../../../services/api';
import { instancesApi } from '../../../services/api';

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

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, []);

  // Opens SSE connection for real-time connection state updates
  const openSSEConnection = useCallback((inst: Instance) => {
    if (esRef.current) {
      esRef.current.close();
    }
    const token = localStorage.getItem('fidscript_client_token');
    if (!token) return;

    const es = new EventSource(`/api/sse/instance/${inst.name}?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { state: string; phoneNumber: string | null };
        if (data.state === 'connected') {
          const updated = instances.map(i =>
            i.id === pairingInstance?.id
              ? { ...i, status: 'connected' as const, phone_number: data.phoneNumber || i.phone_number }
              : i
          );
          onInstancesChange(updated);
          setPairingInstance(null);
          setPairingQR('');
          es.close();
          esRef.current = null;
        }
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      // SSE error — fall back to not polling; the user can tap "Check Connection" if needed
      es.close();
      esRef.current = null;
    };
  }, [instances, pairingInstance, onInstancesChange]);

  // Opens the modal and fetches a fresh QR for the given instance
  const handleConnect = useCallback(async (inst: Instance) => {
    setPairingInstance(inst);
    setConnectionError('');
    setGeneratingQR(true);
    try {
      const res = await instancesApi.connect(inst.name);
      if (res.success && res.data) {
        setPairingQR(res.data.qrcode_image || res.data.qrcode || '');
        // Open SSE connection to receive real-time connection state updates
        openSSEConnection(inst);
      } else {
        setConnectionError(res.error || 'Failed to generate QR code');
      }
    } catch {
      setConnectionError('Failed to connect to Evolution API');
    }
    setGeneratingQR(false);
  }, [openSSEConnection]);

  // Regenerates a new QR for the already-open modal — does NOT create a new instance
  const handleRegenerateQR = useCallback(async () => {
    if (!pairingInstance) return;
    setRegeneratingQR(true);
    setConnectionError('');
    try {
      const res = await instancesApi.connect(pairingInstance.name);
      if (res.success && res.data) {
        setPairingQR(res.data.qrcode_image || res.data.qrcode || '');
      } else {
        setConnectionError(res.error || 'Failed to regenerate QR code');
      }
    } catch {
      setConnectionError('Failed to connect to Evolution API');
    }
    setRegeneratingQR(false);
  }, [pairingInstance]);

  // Manual check — kept for user-initiated fallback when SSE fails
  const handleSimulateSuccessfulScan = useCallback(async () => {
    if (!pairingInstance) return;
    try {
      const res = await instancesApi.getConnectionState(pairingInstance.name);
      if (res.success && res.data && res.data.status === 'connected') {
        const updated = instances.map(i =>
          i.id === pairingInstance.id
            ? { ...i, status: 'connected' as const, phone_number: res.data.phone_number || i.phone_number }
            : i
        );
        onInstancesChange(updated);
        setPairingInstance(null);
        setPairingQR('');
      }
    } catch {
      // Silently fail — SSE will catch the real event
    }
  }, [pairingInstance, instances, onInstancesChange]);

  const handleDisconnect = useCallback(async (inst: Instance) => {
    try {
      await instancesApi.disconnect(inst.name);
      const updated = instances.map(i =>
        i.id === inst.id ? { ...i, status: 'disconnected' as const, phone_number: null } : i
      );
      onInstancesChange(updated);
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
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setPairingInstance(null);
    setPairingQR('');
    setConnectionError('');
  }, []);

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
