import React, { useState } from 'react';
import { X, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreateKeyModalProps {
  show: boolean;
  newKeyName: string;
  onNewKeyNameChange: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CreateKeyModal({
  show,
  newKeyName,
  onNewKeyNameChange,
  onClose,
  onSubmit,
}: CreateKeyModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#2d2813]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2d2813] flex items-center justify-center">
                  <Key className="w-4 h-4 text-[#eab308]" />
                </div>
                <h4 className="font-bold text-sm text-[#a8a99e]">New FidScript API Key</h4>
              </div>
              <button onClick={onClose} className="text-[#6e684a] hover:text-[#a8a99e] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1.5">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ERP Sales Hook, Mobile App"
                  value={newKeyName}
                  onChange={(e) => onNewKeyNameChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#2d2813] bg-[#181711] rounded-xl focus:outline-none focus:border-[#eab308] text-xs text-[#a8a99e] placeholder:text-[#5a554a] font-mono"
                  autoFocus
                />
                <p className="text-[9px] text-[#5a554a] mt-1">A label to identify this key.</p>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#2d2813] rounded-xl text-xs text-[#6e684a] hover:text-[#a8a99e] hover:border-[#3d3a1e] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#eab308] hover:bg-yellow-400 text-[#181711] font-bold text-xs rounded-xl transition-all"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
