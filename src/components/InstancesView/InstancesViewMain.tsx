import React, { useState, useCallback } from 'react';
import { Instance, Client } from '../../services/api';
import { Search, Plus, Smartphone } from 'lucide-react';
import InstanceTable from '../admin/instances/InstanceTable';
import CreateInstanceModal from '../admin/instances/CreateInstanceModal';
import QRPairingModal from '../client/whatsapp/QRPairingModal';
import { useInstanceConnection } from '../client/whatsapp/useInstanceConnection';

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
  const [clientFilter, setClientFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
  } = useInstanceConnection({ instances, onInstancesChange: (updated) => { updated; } });

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#a8a99e]">Containers</h1>
            <p className="text-xs text-[#6e684a] mt-0.5">Manage messaging containers across all clients.</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Container</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="px-3 py-2.5 bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] text-xs rounded-xl focus:outline-none focus:border-yellow-500/50 min-w-[160px]"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e684a] pointer-events-none" />
          <input
            type="text"
            placeholder="Search containers by name, client, or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] placeholder-[#6e684a] text-xs rounded-xl focus:outline-none focus:border-yellow-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-4 text-center">
          <p className="text-xl font-bold text-[#a8a99e]">{instances.length}</p>
          <p className="text-[10px] text-[#6e684a] mt-0.5">Total</p>
        </div>
        <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-4 text-center">
          <p className="text-xl font-bold text-green-400">{instances.filter(i => i.status === 'connected').length}</p>
          <p className="text-[10px] text-[#6e684a] mt-0.5">Connected</p>
        </div>
        <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-4 text-center">
          <p className="text-xl font-bold text-red-400">{instances.filter(i => i.status === 'disconnected').length}</p>
          <p className="text-[10px] text-[#6e684a] mt-0.5">Disconnected</p>
        </div>
      </div>

      {/* Table */}
      <InstanceTable
        instances={filteredInstances}
        onQrConnect={handleQrConnect}
        onDisconnect={handleDisconnectAndRefresh}
        onDelete={onDeleteInstance}
      />

      {/* Create Modal */}
      <CreateInstanceModal
        isOpen={showCreateModal}
        clients={clients.map(c => ({ name: c.name || c.email || '', client_id: c.id }))}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => { onAddInstance(data); setShowCreateModal(false); }}
      />

      {/* QR Modal */}
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
