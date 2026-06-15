import React, { useState } from 'react';
import { InboxMessage } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Calendar, CheckCircle, RotateCcw, ExternalLink, ChevronDown, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';

interface MessageDetailProps {
  message: InboxMessage | null;
  onReplay?: (id: string) => void;
  isReplaying?: boolean;
}

export default function MessageDetail({ message, onReplay, isReplaying }: MessageDetailProps) {
  const [showRaw, setShowRaw] = useState(false);

  const formatPayload = (raw?: string) => {
    if (!raw) return null;
    try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
  };

  const payload = message?.raw_payload ? formatPayload(message.raw_payload) : null;

  return (
    <AnimatePresence mode="wait">
      {message ? (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="bg-white border border-[#e1e9e5]/80 rounded-3xl shadow-sm p-5 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#15803d] border-b border-stone-100 pb-2">
              Webhook Inspector
            </span>
            {message.direction && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                message.direction === 'incoming'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {message.direction === 'incoming'
                  ? <React.Fragment><ArrowDown size={11} /> INCOMING</React.Fragment>
                  : <React.Fragment><ArrowUp size={11} /> OUTGOING</React.Fragment>}
              </span>
            )}
          </div>

          {/* Sender info */}
          <div className="space-y-1">
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

          {/* Content */}
          <div className="space-y-1.5">
            <span className="block text-[9px] font-bold text-graphite uppercase tracking-wide">Content</span>
            <p className="bg-[#f8faf9] border border-[#e1e9e5]/80 p-3 rounded-xl text-xs text-[#1e3228] leading-relaxed">
              {message.content || <span className="italic text-stone-400">empty</span>}
            </p>
          </div>

          {/* Raw payload toggle */}
          {payload && (
            <div className="space-y-2">
              <button
                onClick={() => setShowRaw(v => !v)}
                className="flex items-center gap-1.5 text-[9px] font-bold text-graphite hover:text-forest-deep transition-colors"
              >
                <span className="font-mono uppercase tracking-widest">Raw Payload</span>
                {showRaw ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              <AnimatePresence>
                {showRaw && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <pre className="bg-[#0d1117] text-[#e6edf3] p-3 rounded-xl text-[10px] font-mono overflow-x-auto max-h-64 leading-relaxed">
                      {payload}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Timestamp */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[#556c60] text-[10px]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(message.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-700 font-bold">Stored</span>
            </div>
          </div>

          {/* Replay button */}
          {message.direction === 'incoming' && onReplay && (
            <div className="pt-2 border-t border-stone-100">
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
        <div className="bg-white border border-[#e1e9e5]/80 rounded-[32px] p-8 text-center text-graphite min-h-[300px] flex flex-col items-center justify-center space-y-3">
          <Mail className="w-8 h-8 text-emerald-600/30" />
          <p className="font-bold text-forest-deep text-xs">Select a message</p>
          <p className="text-[10px] max-w-xs leading-relaxed">
            Click on any webhook event to inspect the full raw payload and replay it to your configured endpoint.
          </p>
        </div>
      )}
    </AnimatePresence>
  );
}