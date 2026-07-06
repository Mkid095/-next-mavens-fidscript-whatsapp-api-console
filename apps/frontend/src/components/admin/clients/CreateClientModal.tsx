import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus } from 'lucide-react';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; phone?: string; plan_id?: string }) => void;
}

export default function CreateClientModal({ isOpen, onClose, onSubmit }: CreateClientModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    let formattedPhone = phone.trim();
    if (formattedPhone && !formattedPhone.startsWith('+') && !formattedPhone.startsWith('254')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.slice(1);
      } else {
        formattedPhone = '254' + formattedPhone;
      }
    }

    onSubmit({ name, email, phone: formattedPhone || undefined });
    setName('');
    setEmail('');
    setPhone('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/35" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white border border-[#eaebe4] w-full max-w-sm rounded-3xl shadow-xl p-6 relative z-10 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-[14px] font-bold text-[#272c30]">Add Client</h3>
                <p className="text-[10px] text-[#60737a]">Create a new client account</p>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-stone-50 rounded-lg text-[#60737a]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-wider mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Kenya Ltd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#eaebe4] text-[#181711] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-wider mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ops@company.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#eaebe4] text-[#181711] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6a6c5d] uppercase tracking-wider mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#eaebe4] text-[#181711] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-stone-500 font-semibold hover:text-black hover:bg-stone-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#272c30] text-white font-semibold rounded-xl text-xs hover:bg-[#33301a] transition-all"
                >
                  Create Client
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
