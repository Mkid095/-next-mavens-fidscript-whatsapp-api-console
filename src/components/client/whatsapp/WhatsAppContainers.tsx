import React, { useState, useEffect, useRef } from 'react';
import { Plus, Smartphone } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { instancesApi } from '../../../services/api';
import type { Client, Instance } from '../../../services/api';
import CreateInstanceModal from './CreateInstanceModal';
import QRPairingModal from './QRPairingModal';
import InstanceCard from './InstanceCard';
import InstanceSettingsModal from './InstanceSettingsModal';
import { useInstanceConnection } from './useInstanceConnection';

interface WhatsAppContainersProps {
  client: Client;
  clientToken?: string;
  instances: Instance[];
  onInstancesChange: (instances: Instance[]) => void;
  onTokenDeduct: (n: number) => void;
}

/** Persistent SSE connection per instance name */
const instanceSSEControllers = new Map<string, EventSource>();

function closeSSE(name: string) {
  const es = instanceSSEControllers.get(name);
  if (es) {
    es.close();
    instanceSSEControllers.delete(name);
  }
}

function openSSE(inst: Instance, onInstancesChange: (cb: (prev: Instance[]) => Instance[]) => void) {
  if (instanceSSEControllers.has(inst.name)) return; // already subscribed
  const token = localStorage.getItem('fidscript_client_token');
  if (!token) return;

  const es = new EventSource(`/api/sse/instance/${inst.name}?token=${encodeURIComponent(token)}`);
  instanceSSEControllers.set(inst.name, es);

  es.onmessage = (event) => {
    try {
      const raw = JSON.parse(event.data);
      // Named event: { state: string, phoneNumber } | { id, from_number, ... } | { balance }
      if ('state' in raw) {
        const data = raw as { state: string; phoneNumber: string | null };
        if (data.state === 'disconnected') {
          onInstancesChange(prev => prev.map(i =>
            i.name === inst.name
              ? { ...i, status: 'disconnected' as const, phone_number: null }
              : i
          ));
          closeSSE(inst.name);
        } else if (data.state === 'connected') {
          onInstancesChange(prev => prev.map(i =>
            i.name === inst.name
              ? { ...i, status: 'connected' as const, phone_number: data.phoneNumber || i.phone_number }
              : i
          ));
        }
      } else if ('id' in raw) {
        // newMessage event — dispatch to window for MessagesView
        window.dispatchEvent(new CustomEvent('sse-new-message', { detail: raw }));
      } else if ('balance' in raw) {
        // tokenUpdate event — dispatch to window for App/TokenBalanceBar
        window.dispatchEvent(new CustomEvent('sse-token-update', { detail: raw }));
      }
    } catch {
      // Ignore malformed messages
    }
  };

  es.onclose = () => {
    closeSSE(inst.name);
  };

  es.onerror = () => {
    // Let onclose handle cleanup
  };
}

export default function WhatsAppContainers({
  client,
  clientToken,
  instances,
  onInstancesChange,
  onTokenDeduct,
}: WhatsAppContainersProps) {
  const [showNewInstanceModal, setShowNewInstanceModal] = useState(false);
  const [settingsInstance, setSettingsInstance] = useState<Instance | null>(null);
  const instancesRef = useRef(instances);
  instancesRef.current = instances;

  // Fetch instances on mount if instances prop is empty (direct URL navigation)
  useEffect(() => {
    if (instances.length === 0) {
      instancesApi.getClientInstances().then((res) => {
        if (res.success && res.data) {
          onInstancesChange(res.data);
        }
      }).catch(console.error);
    }
  }, []);

  // Open SSE for all connected instances on mount
  useEffect(() => {
    instances.forEach(inst => {
      if (inst.status === 'connected') {
        openSSE(inst, onInstancesChange);
      }
    });
    return () => {
      instanceSSEControllers.forEach((_, name) => closeSSE(name));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Watch for instances that transition to connected and open SSE for them
  useEffect(() => {
    instances.forEach(inst => {
      if (inst.status === 'connected') {
        openSSE(inst, onInstancesChange);
      }
    });
  }, [instances, onInstancesChange]);

  const {
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
  } = useInstanceConnection({ instances, onInstancesChange });

  const handleCreateInstance = async (name: string) => {
    const res = await instancesApi.clientCreate({
      name: name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ''),
      display_name: name,
    });
    if (res.success && res.data) {
      onInstancesChange([res.data, ...instances]);
      setShowNewInstanceModal(false);
    } else {
      throw new Error(res.error || 'Failed to create container');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#eaebe4] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-forest-deep">My WhatsApp Containers</h3>
            <p className="text-xs text-graphite mt-0.5">Create containers and connect via QR code.</p>
          </div>
          <button
            onClick={() => setShowNewInstanceModal(true)}
            className="px-3.5 py-1.5 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Container</span>
          </button>
        </div>

        {instances.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {instances.map((inst) => (
              <InstanceCard
                key={inst.id}
                inst={inst}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onDelete={handleDeleteInstance}
                onSettings={setSettingsInstance}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-graphite space-y-3">
            <Smartphone className="w-12 h-12 text-yellow-300 mx-auto" />
            <p className="font-bold text-forest-deep">No containers provisioned yet.</p>
            <button onClick={() => setShowNewInstanceModal(true)} className="px-4 py-2 bg-yellow-500 text-stone-950 font-bold text-xs rounded-xl">
              Create your first container
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewInstanceModal && (
          <CreateInstanceModal
            onClose={() => setShowNewInstanceModal(false)}
            onSubmit={handleCreateInstance}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsInstance && (
          <InstanceSettingsModal
            inst={settingsInstance}
            onClose={() => setSettingsInstance(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pairingInstance && (
            <QRPairingModal
            instance={pairingInstance}
            qrCode={pairingQR}
            generatingQR={generatingQR}
            regeneratingQR={regeneratingQR}
            connectionError={connectionError}
            onClose={handleClosePairingModal}
            onCheckConnection={handleSimulateSuccessfulScan}
            onRegenerate={handleRegenerateQR}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
