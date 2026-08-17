import { X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Instance } from '../../../services/api';

interface MediaSendModalProps {
  instance: Instance;
  to: string;
  onClose: () => void;
  onSend: (cost: number) => void;
}

/**
 * MediaSendModal - compose a media message (image/video/document) and dispatch.
 * Stub: full builder is wired through SandboxSection's media upload path; this
 * panel hosts the in-chat picker until the full composer is built.
 */
export default function MediaSendModal({ to, onClose }: MediaSendModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white border border-[#eaebe4] rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-bold text-forest-deep text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-yellow-600" /> Send media
            </h3>
            <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-stone-100">
              <X className="w-4 h-4 text-stone-500" />
            </button>
          </div>
          <p className="text-xs text-graphite">
            Media composer is wired through the API Sandbox. Open
            <code className="mx-1 px-1.5 py-0.5 bg-stone-100 rounded font-mono">/api/v1/messages/media/:instance</code>
            to send to <code className="font-mono">{to}</code>.
          </p>
          <button onClick={onClose} className="w-full py-2 text-xs font-bold text-stone-600 border border-[#eaebe4] rounded-xl hover:bg-stone-50">
            Close
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
