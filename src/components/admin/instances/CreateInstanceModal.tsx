import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface CreateInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; display_name?: string }) => void;
}

export default function CreateInstanceModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateInstanceModalProps) {
  const [newName, setNewName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Instance name is required.');
      return;
    }
    onSubmit({
      name: newName.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ''),
      display_name: newDisplayName || undefined,
    });
    setNewName('');
    setNewDisplayName('');
    setFormError('');
    onClose();
  };

  const handleClose = () => {
    setNewName('');
    setNewDisplayName('');
    setFormError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/35" onClick={handleClose} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white border border-[#eaebe4] w-full max-w-sm rounded-3xl shadow-xl p-6 relative z-10 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-[14px] font-bold text-[#272c30]">Create Instance</h3>
                <p className="text-[10px] text-[#60737a]">Set up a new container for a client</p>
              </div>
              <button onClick={handleClose} className="p-1 hover:bg-stone-50 rounded-lg text-[#60737a]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-wider mb-1">
                  Instance Name *
                </label>
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
                <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-wider mb-1">
                  Display Name
                </label>
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
                  onClick={handleClose}
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
  );
}
