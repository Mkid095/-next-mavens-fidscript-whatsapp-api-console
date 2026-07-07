import React, { useState, useEffect } from 'react';
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

// NOTE: real-time SSE is now owned by useInstanceSSE mounted in ClientDashboard,
// so the stream stays alive on every page (not just this grid). This component
// is a pure consumer — instance status arrives fresh via the `instances` prop.

export default function WhatsAppContainers({
  client,
  clientToken,
  instances,
  onInstancesChange,
  onTokenDeduct,
}: WhatsAppContainersProps) {
  const [showNewInstanceModal, setShowNewInstanceModal] = useState(false);
  const [settingsInstance, setSettingsInstance] = useState<Instance | null>(null);

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

  const handleSyncGroups = async (inst: Instance) => {
    const res = await instancesApi.syncGroups(inst.name);
    if (res.success && res.data) {
      console.info(`[WhatsAppContainers] synced ${res.data.synced} groups for ${inst.name}`);
    } else {
      console.error(`[WhatsAppContainers] group sync failed for ${inst.name}:`, res.error);
    }
  };

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
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2813]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#a8a99e]">My containers</h3>
              <p className="text-xs text-[#6e684a]">Create containers and connect via QR code.</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewInstanceModal(true)}
            className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-[#181711] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
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
                onSyncGroups={handleSyncGroups}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <Smartphone className="w-12 h-12 text-yellow-500 mx-auto" />
            <p className="font-bold text-[#a8a99e]">No containers provisioned yet.</p>
            <button onClick={() => setShowNewInstanceModal(true)} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] font-bold text-xs rounded-xl transition-all">
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
