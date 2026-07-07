import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone } from 'lucide-react';

interface ClientOption {
  name: string;
  client_id: string;
}

interface CreateInstanceModalProps {
  isOpen: boolean;
  clients: ClientOption[];
  onClose: () => void;
  onSubmit: (data: { name: string; display_name?: string; client_id?: string }) => void;
}

export default function CreateInstanceModal({ isOpen, clients, onClose, onSubmit }: CreateInstanceModalProps) {
  const [newName, setNewName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Container name is required.');
      return;
    }
    onSubmit({
      name: newName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ''),
      display_name: newDisplayName || undefined,
      client_id: selectedClientId || undefined,
    });
    setNewName('');
    setNewDisplayName('');
    setSelectedClientId('');
    setFormError('');
  };

  const handleClose = () => {
    setNewName('');
    setNewDisplayName('');
    setSelectedClientId('');
    setFormError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#1a1915] border border-[#2d2813] w-full max-w-sm rounded-3xl shadow-2xl p-6 relative z-10 space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#a8a99e]">New Container</h3>
                  <p className="text-[10px] text-[#6e684a]">Create a WhatsApp messaging container</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#2d2813] transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">
                  Container Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sales-nairobi-1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-xl focus:outline-none focus:border-yellow-500/50 font-mono text-xs placeholder-[#5a554a]"
                />
                <p className="text-[9px] text-[#5a554a] mt-1">Lowercase, numbers, dashes only</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales Team Nairobi"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-xl focus:outline-none focus:border-yellow-500/50 text-xs placeholder-[#5a554a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">
                  Assign to Client
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-xl focus:outline-none focus:border-yellow-500/50 text-xs"
                >
                  <option value="">— Unassigned —</option>
                  {clients.map((c) => (
                    <option key={c.client_id} value={c.client_id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <p className="text-red-400 text-[10px] font-bold bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-[#2d2813] hover:bg-[#3d3a1e] text-[#a8a99e] font-bold text-xs rounded-xl border border-[#2d2813] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-[#181711] font-bold text-xs rounded-xl transition-all"
                >
                  Create Container
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
