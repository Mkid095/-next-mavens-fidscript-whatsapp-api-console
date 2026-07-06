import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

interface MessageFormProps {
  messageText: string;
  onMessageChange: (v: string) => void;
  scheduledAt: string;
  onScheduledChange: (v: string) => void;
  error: string;
}

export default function MessageForm({
  messageText, onMessageChange,
  scheduledAt, onScheduledChange, error,
}: MessageFormProps) {
  return (
    <>
      <div>
        <label className="block text-[9px] font-bold text-[#6e684a] uppercase mb-1">Message</label>
        <textarea
          value={messageText} onChange={e => onMessageChange(e.target.value)} rows={4}
          placeholder="Type your message. {{name}} is replaced per recipient."
          className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] placeholder:text-[#5a554a] focus:outline-none focus:border-[#eab308]"
        />
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[10px] text-[#6e684a]">
            {messageText.length} chars
            {messageText.length > 1600 ? ' (3 SMS segments)' : messageText.length > 400 ? ' (2 SMS segments)' : ''}
          </p>
          <p className="text-[10px] text-[#6e684a]">
            ≈ {messageText.length > 1600 ? 3 : messageText.length > 400 ? 2 : 1} token/recipient
          </p>
        </div>
      </div>

      <div>
        <label className="block text-[9px] font-bold text-[#6e684a] uppercase mb-1 flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Schedule (optional)
        </label>
        <input
          type="datetime-local" value={scheduledAt} onChange={e => onScheduledChange(e.target.value)}
          min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
          className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] focus:outline-none focus:border-[#eab308]"
        />
      </div>

      {error && (
        <p className="text-[10px] text-red-400 bg-red-900/30 border border-red-800/40 rounded-lg p-2 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </>
  );
}
