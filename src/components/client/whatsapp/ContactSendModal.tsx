import React, { useState } from 'react';
import { X, User, SendHorizontal, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import type { Instance } from '../../../services/api';
import { instancesApi } from '../../../services/api';
import { TOKEN_COST } from '../../../utils/tokenCosts';

interface ContactSendModalProps {
  instance: Instance;
  to: string;
  onClose: () => void;
  onSend: (tokenCost: number) => void;
}

export default function ContactSendModal({ instance, to, onClose, onSend }: ContactSendModalProps) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!fullName.trim() || !phoneNumber.trim()) {
      setError('Full name and phone number are required');
      return;
    }
    setSending(true);
    setError('');
    try {
      const contact = {
        fullName: fullName.trim(),
        wuid: phoneNumber.replace(/\D/g, ''),
        phoneNumber: phoneNumber.trim(),
        organization: organization.trim(),
      };
      const res = await instancesApi.sendContact(instance.name, to, contact);
      if (res.success) {
        onSend(TOKEN_COST.CONTACT);
        onClose();
      } else {
        setError(res.error || 'Failed to send contact');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send contact');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-md mx-4 overflow-hidden shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-[#eaebe4] flex items-center justify-between bg-[#fafaf5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-forest-deep">Send Contact</h3>
              <p className="text-[10px] text-stone-500 font-mono">{to}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-stone-200 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Phone Number *</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="+254 712 345 678"
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Organization (optional)</label>
            <input
              type="text"
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              placeholder="Acme Corp"
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600">{error}</div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-stone-400">{TOKEN_COST.CONTACT} token</span>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#eaebe4] flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#eaebe4] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!fullName.trim() || !phoneNumber.trim() || sending}
            className="flex-1 py-2.5 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <SendHorizontal className="w-3.5 h-3.5" />}
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
