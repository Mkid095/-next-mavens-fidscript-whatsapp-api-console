import React, { useState } from 'react';
import { Instance } from '../services/api';
import { Search, Plus, QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import InstanceTable from './admin/instances/InstanceTable';
import CreateInstanceModal from './admin/instances/CreateInstanceModal';

interface InstancesViewProps {
  instances: Instance[];
  clientsList: string[];
  onAddInstance: (data: { name: string; display_name?: string; client_id?: string }) => void;
  onUpdateStatus: (name: string, status: string) => void;
  onDeleteInstance: (name: string) => void;
}

export default function InstancesView({
  instances,
  clientsList,
  onAddInstance,
  onUpdateStatus,
  onDeleteInstance,
}: InstancesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState<string | null>(null);

  const filteredInstances = instances.filter((inst) => {
    const term = searchTerm.toLowerCase();
    return (
      inst.name.toLowerCase().includes(term) ||
      (inst.client_name || '').toLowerCase().includes(term) ||
      (inst.phone_number || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#272c30]">
            WhatsApp Instances
          </h1>
          <p className="text-xs text-[#60737a] mt-1">
            Manage WhatsApp instances across all clients.
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

      <div className="p-4 bg-white border border-[#eaebe4]/80 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8c80] pointer-events-none" />
          <input
            type="text"
            placeholder="Search instances by name, client, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f9f9f2] border border-[#eaebe4] text-[#181711] placeholder-[#8a8c80] text-xs rounded-xl focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 transition-colors"
          />
        </div>
      </div>

      <div className="bg-white border border-[#eaebe4]/80 rounded-2xl shadow-sm overflow-hidden">
        <InstanceTable
          instances={filteredInstances}
          onQrConnect={(name) => setShowQrModal(name)}
          onDisconnect={(name) => onUpdateStatus(name, 'disconnected')}
          onDelete={onDeleteInstance}
        />
      </div>

      <CreateInstanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => {
          onAddInstance(data);
          setIsModalOpen(false);
        }}
      />

      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-900/35" onClick={() => setShowQrModal(null)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#eaebe4] w-full max-w-sm rounded-3xl shadow-xl p-6 relative z-10"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-[14px] font-bold text-[#272c30]">Connect WhatsApp</h3>
                  <p className="text-[10px] text-[#60737a]">Scan the QR code with your phone</p>
                </div>
                <button onClick={() => setShowQrModal(null)} className="p-1 hover:bg-stone-50 rounded-lg text-[#60737a]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6 text-center">
                <div className="w-48 h-48 bg-[#f9f9f2] border-2 border-dashed border-[#eaebe4] rounded-2xl mx-auto flex items-center justify-center mb-4">
                  <QrCode className="w-16 h-16 text-[#d1d5db]" />
                </div>
                <p className="text-[10px] text-[#7d8071]">
                  Open WhatsApp → Settings → Linked Devices → Link a Device
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
