import React, { useState } from 'react';
import { Instance } from '../services/api';
import {
  Search,
  Plus,
  Smartphone,
  Radio,
  QrCode,
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Link2,
  Unlink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  // Form state
  const [newName, setNewName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newClient, setNewClient] = useState('');
  const [formError, setFormError] = useState('');

  // Filtering
  const filteredInstances = instances.filter((inst) => {
    const term = searchTerm.toLowerCase();
    return (
      inst.name.toLowerCase().includes(term) ||
      (inst.client_name || '').toLowerCase().includes(term) ||
      (inst.phone_number || '').toLowerCase().includes(term)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Instance name is required.');
      return;
    }

    // Find client_id from client name
    const clientId = clientsList.length > 0 ? undefined : undefined;

    onAddInstance({
      name: newName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ''),
      display_name: newDisplayName || undefined,
    });

    setNewName('');
    setNewDisplayName('');
    setNewClient('');
    setFormError('');
    setIsModalOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'disconnected':
        return 'bg-stone-100 text-stone-500 border-stone-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-stone-100 text-stone-500 border-stone-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'connecting':
        return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      default:
        return <Radio className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">

      {/* Page Title */}
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

      {/* Search bar */}
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

      {/* Instances Table */}
      <div className="bg-white border border-[#eaebe4]/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f9f9f2] border-b border-[#eaebe4]">
                <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Instance</th>
                <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Phone</th>
                <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Messages</th>
                <th className="text-left px-5 py-3 font-bold text-[#6a6c5d] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaebe4]/60">
              {filteredInstances.map((inst) => (
                <tr key={inst.id} className="hover:bg-[#f9f9f2]/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-bold text-[#272c30]">{inst.display_name || inst.name}</p>
                        <p className="text-[9px] text-[#7d8071] font-mono">{inst.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[#525345]">{inst.client_name || '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[#525345]">{inst.phone_number || '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(inst.status)}`}>
                      {getStatusIcon(inst.status)}
                      {inst.status.charAt(0).toUpperCase() + inst.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-bold text-[#272c30]">{inst.total_messages.toLocaleString()}</p>
                      <p className="text-[9px] text-[#7d8071]">total</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {inst.status === 'disconnected' && (
                        <button
                          onClick={() => setShowQrModal(inst.name)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Connect via QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                      {inst.status === 'connected' && (
                        <button
                          onClick={() => onUpdateStatus(inst.name, 'disconnected')}
                          className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors"
                          title="Disconnect"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteInstance(inst.name)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete instance"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredInstances.length === 0 && (
          <div className="text-center py-12">
            <Smartphone className="w-12 h-12 text-[#d1d5db] mx-auto mb-4" />
            <p className="text-[#6a6c5d]">No instances found</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-sm text-yellow-600 hover:text-yellow-700 font-semibold"
            >
              Create your first instance
            </button>
          </div>
        )}
      </div>

      {/* Create Instance Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-900/35" onClick={() => setIsModalOpen(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#eaebe4] w-full max-w-sm rounded-3xl shadow-xl p-6 relative z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-[14px] font-bold text-[#272c30]">Create Instance</h3>
                  <p className="text-[10px] text-[#60737a]">Set up a new WhatsApp instance</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-stone-50 rounded-lg text-[#60737a]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-wider mb-1">Instance Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sales-nairobi-1"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#eaebe4] text-[#181711] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500 font-mono"
                  />
                  <p className="text-[9px] text-[#7d8071] mt-1">Unique identifier for this instance</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-wider mb-1">Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales Team Nairobi"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#eaebe4] text-[#181711] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  />
                </div>

                {formError && (
                  <p className="text-red-500 text-[10px]">{formError}</p>
                )}

                <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-stone-500 font-semibold hover:text-black hover:bg-stone-50 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#272c30] text-white font-semibold rounded-xl text-xs hover:bg-[#33301a] transition-all"
                  >
                    Create Instance
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
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
