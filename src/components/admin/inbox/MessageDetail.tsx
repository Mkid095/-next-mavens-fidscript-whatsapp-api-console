import React from 'react';
import { InboxMessage } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Calendar, CheckCircle, RotateCcw, ArrowDown, ArrowUp, Shield } from 'lucide-react';

interface MessageDetailProps {
  message: InboxMessage | null;
  onReplay?: (id: string) => void;
  isReplaying?: boolean;
}

export default function MessageDetail({ message, onReplay, isReplaying }: MessageDetailProps) {
  return (
    <AnimatePresence mode="wait">
      {message ? (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="bg-white border border-[#e1e9e5]/80 rounded-3xl shadow-sm p-5 space-y-4 overflow-y-auto max-h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#15803d] border-b border-stone-100 pb-2">
              Message Details
            </span>
            {message.direction && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                message.direction === 'incoming'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {message.direction === 'incoming'
                  ? <><ArrowDown size={10} /> INCOMING</>
                  : <><ArrowUp size={10} /> OUTGOING</>}
              </span>
            )}
          </div>

          {/* Sender info */}
          <div className="space-y-2 shrink-0">
            <h3 className="font-bold text-sm text-forest-deep">{message.from_name || message.from_number}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold text-[#15803d] bg-emerald-50 rounded-full border border-emerald-100 uppercase">
                {message.from_number}
              </span>
              {message.instance_name && (
                <span className="inline-block px-2 py-0.5 text-[9px] font-mono text-stone-500 bg-stone-100 rounded border border-stone-200">
                  {message.instance_name}
                </span>
              )}
              {message.message_type && message.message_type !== 'text' && (
                <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-purple-700 bg-purple-50 rounded border border-purple-200">
                  {message.message_type}
                </span>
              )}
            </div>
          </div>

          {/* Timestamp & Status */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-[#556c60] text-[10px]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(message.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-700 font-bold text-[10px]">Stored</span>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="flex items-start gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl shrink-0">
            <Shield className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
            <p className="text-[9px] text-stone-500 leading-relaxed">
              Message content is private to the client. Only delivery metadata and sender info are visible to admins.
            </p>
          </div>

          {/* Replay button */}
          {message.direction === 'incoming' && onReplay && (
            <div className="pt-2 border-t border-stone-100 shrink-0">
              <button
                onClick={() => onReplay(message.id)}
                disabled={isReplaying}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl transition-colors"
              >
                {isReplaying ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⟳</span> Replaying...
                  </span>
                ) : (
                  <><RotateCcw className="w-3 h-3" /> Replay to Webhook</>
                )}
              </button>
              <p className="text-[9px] text-stone-400 text-center mt-1">
                Re-fires raw payload to the instance's configured webhook_url
              </p>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="bg-white border border-[#e1e9e5]/80 rounded-[32px] p-8 text-center text-graphite h-full flex flex-col items-center justify-center space-y-3">
          <Mail className="w-8 h-8 text-emerald-600/30" />
          <p className="font-bold text-forest-deep text-xs">Select a message</p>
          <p className="text-[10px] max-w-xs leading-relaxed">
            Click any webhook event to inspect delivery metadata. Message content is private to the client.
          </p>
        </div>
      )}
    </AnimatePresence>
  );
}