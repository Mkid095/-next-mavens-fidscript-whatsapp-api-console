import React, { useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

interface CreateInstanceModalProps {
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export default function CreateInstanceModal({ onClose, onSubmit }: CreateInstanceModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(name.trim());
    } catch {
      setError('Failed to create WhatsApp number');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2d2813] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#a8a99e]">New WhatsApp Number</h4>
              <p className="text-[10px] text-[#6e684a]">Add a new number to your account</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#2d2813] flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-[#6e684a]" />
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1.5">Number Name</label>
            <input
              type="text"
              required
              placeholder="e.g. nairobi-dispatch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#2d2813] bg-[#181711] rounded-xl focus:outline-none focus:border-yellow-500 font-mono text-xs text-[#a8a99e]"
            />
            <p className="text-[9px] text-[#5a554a] mt-1">Lowercase, no spaces. Use - or _</p>
          </div>
          {error && (
            <div className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-xl px-3 py-2">{error}</div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#2d2813] hover:bg-[#2d2813] rounded-xl text-xs text-[#6e684a]">Close</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] rounded-xl text-xs font-bold disabled:opacity-40 transition-all">
              {submitting ? 'Creating...' : 'Create Number'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
