import { X, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Instance } from '../../../services/api';

interface ListSendModalProps {
  instance: Instance;
  to: string;
  onClose: () => void;
  onSend: (cost: number) => void;
}

/**
 * ListSendModal - send an interactive list message (sections + rows).
 * Full builder lives at the API Sandbox (`/api/v1/messages/list`).
 */
export default function ListSendModal({ to, onClose }: ListSendModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white border border-[#eaebe4] rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-bold text-forest-deep text-sm flex items-center gap-2">
              <List className="w-4 h-4 text-yellow-600" /> Send list
            </h3>
            <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-stone-100">
              <X className="w-4 h-4 text-stone-500" />
            </button>
          </div>
          <p className="text-xs text-graphite">
            Compose sections + rows in the API Sandbox
            (<code className="font-mono">/api/v1/messages/list</code>) and dispatch to
            <code className="ml-1 font-mono">{to}</code>.
          </p>
          <button onClick={onClose} className="w-full py-2 text-xs font-bold text-stone-600 border border-[#eaebe4] rounded-xl hover:bg-stone-50">
            Close
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
