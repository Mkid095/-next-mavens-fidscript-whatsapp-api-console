import React, { useState } from 'react';
import { X } from 'lucide-react';
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
      setError('Failed to create container');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h4 className="font-bold text-sm">New WhatsApp Container</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-forest-deep">
          <div>
            <label className="block text-[10px] font-bold text-graphite uppercase mb-1.5">Container Name</label>
            <input
              type="text"
              required
              placeholder="e.g. nairobi-dispatch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none font-mono text-xs"
            />
            <p className="text-[9px] text-stone-400 mt-1">Lowercase, no spaces. Use - or _</p>
          </div>
          {error && (
            <div className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}
          <div className="flex gap-2 justify-end pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs">Close</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-forest-deep text-white hover:bg-[#33301a] rounded-xl text-xs font-bold disabled:opacity-40">
              {submitting ? 'Creating...' : 'Create Container'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
