import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { RATE_LIMIT_PER_SEC } from '../types';

interface BulkMessagePanelProps {
  contacts: { id: string; phone: string; name: string }[];
  selectedContacts: Set<string>;
  tokenBalance: number;
  onTokenDeduct: (n: number) => void;
}

export default function BulkMessagePanel({
  contacts,
  selectedContacts,
  tokenBalance,
  onTokenDeduct,
}: BulkMessagePanelProps) {
  const [bulkMessage, setBulkMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0, failed: 0 });
  const sendingRef = useRef(false);
  const queueRef = useRef<{ id: string; phone: string; name?: string; message: string; status: 'pending' | 'sent' | 'failed'; created_at: string }[]>([]);

  const handleSendBulk = () => {
    if (!bulkMessage.trim()) return;
    const targets = selectedContacts.size > 0
      ? contacts.filter(c => selectedContacts.has(c.id))
      : contacts;

    if (targets.length === 0) return;

    sendingRef.current = true;
    setSending(true);
    setSendProgress({ sent: 0, total: targets.length, failed: 0 });
    queueRef.current = targets.map(c => ({
      id: `q-${Date.now()}-${c.id}`,
      phone: c.phone,
      name: c.name,
      message: bulkMessage,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      source: 'platform' as const,
    }));

    let idx = 0;
    const interval = setInterval(() => {
      if (!sendingRef.current || idx >= targets.length) {
        clearInterval(interval);
        setSending(false);
        sendingRef.current = false;
        return;
      }
      const msg = queueRef.current[idx];
      onTokenDeduct(1);
      setSendProgress(p => ({ ...p, sent: p.sent + 1 }));
      queueRef.current[idx] = { ...msg, status: 'sent' };
      idx++;
    }, RATE_LIMIT_PER_SEC * 1000);
  };

  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl p-5 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5"><Send className="w-4 h-4 text-yellow-700" /> Bulk Message</h3>
        <p className="text-xs text-graphite mt-0.5">
          Send to {selectedContacts.size > 0 ? `${selectedContacts.size} selected` : `all ${contacts.length} contacts`} | Rate: 1 message per {RATE_LIMIT_PER_SEC} seconds
        </p>
      </div>
      <textarea
        rows={4}
        value={bulkMessage}
        onChange={(e) => setBulkMessage(e.target.value)}
        placeholder="Type your message here..."
        className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl focus:outline-none text-xs resize-none"
      />
      {sending && (
        <div className="bg-[#f9f9f2] border border-[#eaebe4] rounded-xl p-3">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span>Sending...</span>
            <span>{sendProgress.sent}/{sendProgress.total}</span>
          </div>
          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: `${(sendProgress.sent / sendProgress.total) * 100}%` }} />
          </div>
        </div>
      )}
      <button
        onClick={handleSendBulk}
        disabled={sending || !bulkMessage.trim() || tokenBalance <= 0}
        className="w-full inline-flex items-center justify-center gap-2 bg-forest-deep hover:bg-[#33301a] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
      >
        <Send className="w-3.5 h-3.5 text-yellow-400" />
        <span>{sending ? `Sending ${sendProgress.sent}/${sendProgress.total}...` : `Send to ${selectedContacts.size > 0 ? selectedContacts.size : contacts.length} contacts`}</span>
      </button>
    </div>
  );
}
