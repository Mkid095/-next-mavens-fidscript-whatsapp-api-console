import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddContactModalProps {
  open: boolean;
  name: string;
  phone: string;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function AddContactModal({
  open, name, phone, onName, onPhone, onClose, onSave,
}: AddContactModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h4 className="font-bold text-sm">Add Test Contact</h4>
              <button onClick={onClose} className="text-gray-400 hover:text-black"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Name</label>
                <input type="text" value={name} onChange={e => onName(e.target.value)} placeholder="John Doe" className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Phone (with country code)</label>
                <input type="text" value={phone} onChange={e => onPhone(e.target.value)} placeholder="254712345678" className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 text-xs font-mono" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={onClose} className="px-4 py-2 border border-stone-200 rounded-xl hover:bg-stone-50">Cancel</button>
                <button onClick={onSave} className="px-4 py-2 bg-forest-deep hover:bg-[#33301a] text-white font-bold text-xs rounded-xl">Save Contact</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
