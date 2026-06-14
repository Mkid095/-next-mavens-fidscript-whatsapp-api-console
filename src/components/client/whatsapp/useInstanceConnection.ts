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
  const connectionCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
      }
    };
  }, []);

  // Opens the modal and fetches a fresh QR for the given instance
  const handleConnect = useCallback(async (inst: Instance) => {
    setPairingInstance(inst);
    setConnectionError('');
    setGeneratingQR(true);
    try {
      const res = await instancesApi.connect(inst.name);
      if (res.success && res.data) {
        setPairingQR(res.data.qrcode_image || res.data.qrcode || '');
      } else {
        setConnectionError(res.error || 'Failed to generate QR code');
      }
    } catch {
      setConnectionError('Failed to connect to Evolution API');
    }
    setGeneratingQR(false);
  }, []);

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

  // Polls connection state until the instance is connected or fails
  const handleSimulateSuccessfulScan = useCallback(() => {
    if (!pairingInstance) return;
    if (connectionCheckInterval.current) {
      clearInterval(connectionCheckInterval.current);
    }
    const interval = setInterval(async () => {
      try {
        const res = await instancesApi.getConnectionState(pairingInstance.name);
        if (res.success && res.data) {
          if (res.data.status === 'connected') {
            clearInterval(interval);
            connectionCheckInterval.current = null;
            const updated = instances.map(i =>
              i.id === pairingInstance.id
                ? { ...i, status: 'connected' as const, phone_number: res.data.phone_number || i.phone_number }
                : i
            );
            onInstancesChange(updated);
            setPairingInstance(null);
            setPairingQR('');
          } else if (res.data.status === 'disconnected' || res.data.status === 'error') {
            clearInterval(interval);
            connectionCheckInterval.current = null;
          }
        }
      } catch {
        // keep polling
      }
    }, 3000);
    connectionCheckInterval.current = interval;
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
    if (connectionCheckInterval.current) {
      clearInterval(connectionCheckInterval.current);
      connectionCheckInterval.current = null;
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
