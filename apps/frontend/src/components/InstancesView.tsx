import React, { useState, useCallback } from 'react';
import { Instance, Client } from '../services/api';
import { Search, Plus } from 'lucide-react';
import { InstanceTable } from './admin/instances/InstanceTable';
import CreateInstanceModal from './admin/instances/CreateInstanceModal';
import QRPairingModal from './client/whatsapp/QRPairingModal';
import { useInstanceConnection } from './client/whatsapp/useInstanceConnection';

interface InstancesViewProps {
  instances: Instance[];
  clients: Client[];
  onAddInstance: (data: { name: string; display_name?: string; client_id?: string }) => void;
  onUpdateStatus: (name: string, status: string) => void;
  onDeleteInstance: (name: string) => void;
}

export default function InstancesView({
  instances,
  clients,
  onAddInstance,
  onUpdateStatus,
  onDeleteInstance,
}: InstancesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientFilter, setClientFilter] = useState<string>('');

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
    handleClosePairingModal,
  } = useInstanceConnection({ instances, onInstancesChange: (updated) => {
    // Sync updated instances back to parent — admin instances list refreshes
    updated; // handled via onUpdateStatus callbacks for now
  }});

  const handleQrConnect = useCallback((name: string) => {
    const inst = instances.find(i => i.name === name);
    if (inst) handleConnect(inst);
  }, [instances, handleConnect]);

  const handleDisconnectAndRefresh = useCallback(async (name: string) => {
    await handleDisconnect(instances.find(i => i.name === name) || { name } as Instance);
    onUpdateStatus(name, 'disconnected');
  }, [handleDisconnect, instances, onUpdateStatus]);

  const filteredInstances = instances.filter((inst) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      inst.name.toLowerCase().includes(term) ||
      (inst.client_name || '').toLowerCase().includes(term) ||
      (inst.phone_number || '').includes(term);
    const matchesClient = !clientFilter || inst.client_id === clientFilter || inst.client_name === clientFilter;
    return matchesSearch && matchesClient;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#272c30]">
            Containers
          </h1>
          <p className="text-xs text-[#60737a] mt-1">
            Manage messaging containers across all clients.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#272c30] hover:bg-[#33301a] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm border border-[#3d3a1e] transition-colors"
        >
          <Plus className="w-4 h-4 text-yellow-400" />
          <span>Create Instance</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Client filter dropdown */}
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs text-[#181711] focus:outline-none focus:border-yellow-600 min-w-[180px]"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8c80] pointer-events-none" />
          <input
            type="text"
            placeholder="Search instances by name, client, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#eaebe4] text-[#181711] placeholder-[#8a8c80] text-xs rounded-xl focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 transition-colors"
          />
        </div>
      </div>

      <div className="bg-white border border-[#eaebe4]/80 rounded-2xl shadow-sm overflow-hidden">
        <InstanceTable
          instances={filteredInstances}
          onQrConnect={handleQrConnect}
          onDisconnect={handleDisconnectAndRefresh}
          onDelete={onDeleteInstance}
        />
      </div>

      <CreateInstanceModal
        isOpen={isModalOpen}
        clients={instances
          .map(i => i.client_name)
          .filter(Boolean)
          .filter((v, idx, arr) => arr.indexOf(v) === idx)
          .map(name => ({ name, client_id: instances.find(i => i.client_name === name)?.client_id || '' }))
        }
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          onAddInstance(data);
          setIsModalOpen(false);
        }}
      />

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
    </div>
  );
}