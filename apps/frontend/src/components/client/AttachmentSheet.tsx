import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image, FileText, User, MapPin, BarChart2, List } from 'lucide-react';

export type AttachmentType = 'photo' | 'document' | 'contact' | 'location' | 'poll' | 'list';

interface AttachmentSheetProps {
  open: boolean;
  onSelect: (type: AttachmentType) => void;
  onClose: () => void;
}

const ITEMS: { type: AttachmentType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'photo', label: 'Photo & Video', icon: <Image className="w-6 h-6" />, color: 'bg-green-100 text-green-600' },
  { type: 'document', label: 'Document', icon: <FileText className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600' },
  { type: 'contact', label: 'Contact', icon: <User className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600' },
  { type: 'location', label: 'Location', icon: <MapPin className="w-6 h-6" />, color: 'bg-red-100 text-red-600' },
  { type: 'poll', label: 'Poll', icon: <BarChart2 className="w-6 h-6" />, color: 'bg-yellow-100 text-yellow-600' },
  { type: 'list', label: 'Interactive Message', icon: <List className="w-6 h-6" />, color: 'bg-indigo-100 text-indigo-600' },
];

export default function AttachmentSheet({ open, onSelect, onClose }: AttachmentSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="overflow-hidden border-t border-[#eaebe4] bg-white"
          onClick={onClose}
        >
          <div className="p-3 grid grid-cols-6 gap-2" onClick={e => e.stopPropagation()}>
            {ITEMS.map(item => (
              <button
                key={item.type}
                onClick={() => onSelect(item.type)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-stone-50 transition-all active:scale-95"
              >
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold text-forest-deep text-center leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
