import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegenerateKeyModalProps {
  show: boolean;
  keyName: string;
  regenerating: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RegenerateKeyModal({
  show,
  keyName,
  regenerating,
  onClose,
  onConfirm,
}: RegenerateKeyModalProps) {
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
                <div className="w-7 h-7 rounded-lg bg-amber-900/40 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="font-bold text-sm text-[#a8a99e]">Regenerate API Key</h4>
              </div>
              <button onClick={onClose} className="text-[#6e684a] hover:text-[#a8a99e] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-amber-900/20 border border-amber-900/40 rounded-xl">
                <p className="text-xs font-bold text-amber-400 mb-1">This will replace the current key</p>
                <p className="text-[11px] text-[#6e684a] leading-relaxed">
                  The existing key <strong className="text-[#a8a99e]">"{keyName}"</strong> will be permanently revoked and cannot be recovered.
                  A new key will be generated with the same name.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-[#2d2813] rounded-xl text-xs text-[#6e684a] hover:text-[#a8a99e] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={regenerating}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {regenerating
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />
                  }
                  Regenerate Key
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
