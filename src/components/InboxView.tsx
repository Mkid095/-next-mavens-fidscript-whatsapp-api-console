import React, { useState } from 'react';
import { InboxMessage } from '../types';
import { Mail, MailOpen, User, Calendar, Tag, Layers, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InboxViewProps {
  messages: InboxMessage[];
  onMarkRead: (id: string) => void;
}

export default function InboxView({ messages, onMarkRead }: InboxViewProps) {
  const [selectedMsg, setSelectedMsg] = useState<InboxMessage | null>(null);

  const handleSelectMessage = (msg: InboxMessage) => {
    setSelectedMsg(msg);
    onMarkRead(msg.id);
  };

  return (
    <div className="space-y-6 flex flex-col">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-forest-deep">
          Evolution Alerts Inbox
        </h1>
        <p className="text-xs text-graphite mt-1">
          Stay synchronized with cluster core updates, Safaricom Daraja maintenance notices, and developer support logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Messages list */}
        <div className="lg:col-span-3 space-y-3">
          <span className="block font-mono text-[9px] uppercase font-bold tracking-widest text-[#15803d]">
            Secure Payload Inbox
          </span>

          <div className="divide-y divide-stone-100 border border-[#e1e9e5]/80 bg-white rounded-3xl shadow-sm overflow-hidden">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleSelectMessage(msg)}
                className={`p-4 cursor-pointer transition-colors flex items-start gap-3.5 ${
                  selectedMsg?.id === msg.id
                    ? 'bg-emerald-50/60 border-l-2 border-emerald-600'
                    : 'hover:bg-eco-bg/30'
                } ${!msg.read ? 'bg-[#10b981]/5 font-semibold' : ''}`}
              >
                <div className="mt-1 shrink-0 bg-[#f0f4f2] p-2 rounded-xl text-emerald-700">
                  {msg.read ? (
                    <MailOpen className="w-4 h-4 text-[#5c7266]" />
                  ) : (
                    <Mail className="w-4 h-4 text-emerald-600 animate-pulse" />
                  )}
                </div>

                <div className="flex-1 space-y-1 min-w-0 font-sans">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-graphite">
                    <span className="font-bold uppercase tracking-wider text-emerald-800">
                      {msg.sender}
                    </span>
                    <span className="font-mono text-[9px]">
                      {msg.date}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-forest-deep truncate">
                    {msg.subject}
                  </h3>
                  <p className="text-[11px] text-[#4d6458] truncate">
                    {msg.snippet}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected message reading view */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedMsg ? (
              <motion.div
                key={selectedMsg.id}
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
                    <h3 className="font-bold text-sm text-forest-deep">
                      {selectedMsg.sender}
                    </h3>
                    <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold text-[#15803d] bg-emerald-50 rounded-full border border-emerald-100 uppercase">
                      {selectedMsg.role}
                    </span>
                  </div>

                  <div className="space-y-1.5 pb-2 border-b border-stone-100">
                    <span className="block text-[9px] font-bold text-graphite uppercase tracking-wide">
                      Subject
                    </span>
                    <h2 className="text-xs font-bold text-forest-deep leading-relaxed">
                      {selectedMsg.subject}
                    </h2>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-bold text-graphite uppercase tracking-wide">
                      Payload details
                    </span>
                    <p className="bg-[#f8faf9] border border-[#e1e9e5]/80 p-4 rounded-2xl text-xs text-[#1e3228] leading-relaxed">
                      {selectedMsg.body}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-[#556c60] text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Dispatched {selectedMsg.date}</span>
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
                <p className="text-[10px] max-w-xs leading-relaxed">Click on any operational notification inside the thread queue to inspect signature credentials or Daraja endpoints.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
