import React from 'react';
import { X, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { InstanceSettingsModalProps } from './InstanceSettingsTypes';
import { InstanceSettingsForm } from './InstanceSettingsForm';

export default function InstanceSettingsModal({ inst, onClose }: InstanceSettingsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2d2813] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2d2813] flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-[#a8a99e]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#a8a99e]">Container Settings</h3>
              <p className="text-[10px] text-[#6e684a] font-mono">{inst.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#2d2813] flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-[#6e684a]" />
          </button>
        </div>

        <InstanceSettingsForm inst={inst} onClose={onClose} />
      </motion.div>
    </div>
  );
}
