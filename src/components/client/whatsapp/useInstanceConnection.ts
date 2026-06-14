import { useState, useCallback, useRef, useEffect } from 'react';
import type { Instance } from '../../../services/api';
import { instancesApi, createInstanceSSE } from '../../../services/api';

interface UseInstanceConnectionProps {
  instances: Instance[];
  onInstancesChange: (instances: Instance[]) => void;
}

export function useInstanceConnection({ instances, onInstancesChange }: UseInstanceConnectionProps) {
  const [pairingInstance, setPairingInstance] = useState<Instance | null>(null);
  const [pairingQR, setPairingQR] = useState<string>('');
  const [pairingMode, setPairingMode] = useState<'qr' | 'code'>('qr');
  const [linkCode, setLinkCode] = useState<string>('');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const connectionCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
      }
    };
  }, []);

  const handleConnect = useCallback(async (inst: Instance, mode: 'qr' | 'code') => {
    setPairingInstance(inst);
    setPairingMode(mode);
    setConnectionError('');
    setConnecting(true);

    if (mode === 'qr') {
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
    } else {
      try {
        const res = await instancesApi.connect(inst.name);
        if (res.success && res.data?.link_code) {
          setLinkCode(res.data.link_code);
        } else {
          setLinkCode('CODE_REQUESTED');
        }
      } catch {
        setLinkCode('CODE_REQUESTED');
      }
    }
    setConnecting(false);
  }, []);

  const handleSimulateSuccessfulScan = useCallback(() => {
    if (!pairingInstance) return;
    if (connectionCheckInterval.current) {
      clearInterval(connectionCheckInterval.current);
      connectionCheckInterval.current = null;
    }
    // Keep polling for initial QR scan check during pairing (per requirements)
    const interval = setInterval(async () => {
      try {
        const res = await instancesApi.getConnectionState(pairingInstance.name);
        if (res.success && res.data) {
          const data = res.data;
          if (data.status === 'connected') {
            clearInterval(interval);
            connectionCheckInterval.current = null;
            const updated = instances.map(i =>
              i.id === pairingInstance.id
                ? { ...i, status: 'connected' as const, phone_number: data.phone_number || i.phone_number }
                : i
            );
            onInstancesChange(updated);
            setPairingInstance(null);
            setPairingQR('');
            setLinkCode('');
          } else if (data.status === 'disconnected' || data.status === 'error') {
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
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setPairingInstance(null);
    setPairingQR('');
    setLinkCode('');
  }, []);

  return {
    pairingInstance,
    pairingQR,
    pairingMode,
    linkCode,
    generatingQR,
    connecting,
    connectionError,
    handleConnect,
    handleSimulateSuccessfulScan,
    handleDisconnect,
    handleDeleteInstance,
    handleClosePairingModal,
  };
}
