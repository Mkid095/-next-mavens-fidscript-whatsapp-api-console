import React from 'react';
import { InboxMessage } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Calendar, CheckCircle } from 'lucide-react';

interface MessageDetailProps {
  message: InboxMessage | null;
}

export default function MessageDetail({ message }: MessageDetailProps) {
  return (
    <AnimatePresence mode="wait">
      {message ? (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="bg-white border border-[#e1e9e5]/80 rounded-3xl shadow-sm p-5 space-y-5"
        >
          <span className="block font-mono text-[9px] uppercase font-bold tracking-widest text-[#15803d] border-b border-stone-100 pb-2">
            Handshake Context Panel
          </span>

          <div className="space-y-4 text-xs text-[#0f241d]">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-forest-deep">{message.from_name || message.from_number}</h3>
              <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold text-[#15803d] bg-emerald-50 rounded-full border border-emerald-100 uppercase">
                {message.from_number}
              </span>
            </div>

            <div className="space-y-1.5 pb-2 border-b border-stone-100">
              <span className="block text-[9px] font-bold text-graphite uppercase tracking-wide">Message</span>
              <h2 className="text-xs font-bold text-forest-deep leading-relaxed">{message.content.substring(0, 100)}</h2>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[9px] font-bold text-graphite uppercase tracking-wide">
                Payload details
              </span>
              <p className="bg-[#f8faf9] border border-[#e1e9e5]/80 p-4 rounded-2xl text-xs text-[#1e3228] leading-relaxed">
                {message.content}
              </p>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-[#556c60] text-[10px]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Received {new Date(message.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-700 font-bold">Audit safe & signed</span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white border border-[#e1e9e5]/80 rounded-[32px] p-8 text-center text-graphite min-h-[300px] flex flex-col items-center justify-center space-y-3">
          <Mail className="w-8 h-8 text-emerald-600/30" />
          <p className="font-bold text-forest-deep text-xs">Select an alert message</p>
          <p className="text-[10px] max-w-xs leading-relaxed">
            Click on any operational notification inside the thread queue to inspect signature credentials or Daraja endpoints.
          </p>
        </div>
      )}
    </AnimatePresence>
  );
}
