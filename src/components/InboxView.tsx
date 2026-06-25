import React, { useState, useEffect, useCallback } from 'react';
import { InboxMessage } from '../types';
import { adminApi } from '../services/admin';
import MessageList from './admin/inbox/MessageList';
import MessageDetail from './admin/inbox/MessageDetail';

interface InboxViewProps {
  messages: InboxMessage[]; // passed from App.tsx but we manage our own
  onMarkRead: (id: string) => void;
}

export default function InboxView({ messages, onMarkRead }: InboxViewProps) {
  const [msgs, setMsgs] = useState<InboxMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<InboxMessage | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const res = await adminApi.getMessages(1, 100, filter === 'all' ? undefined : filter);
    if (res.success && res.data) {
      setMsgs(res.data.map(m => ({
        ...m,
        read: !!(m as { is_read?: boolean }).is_read,
      })));
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const handleSelectMessage = (msg: InboxMessage) => {
    setSelectedMsg(msg);
    if (!msg.read) {
      onMarkRead(msg.id);
      setMsgs(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    }
  };

  const handleReplay = async (id: string) => {
    setReplayingId(id);
    const res = await adminApi.replayMessage(id);
    setReplayingId(null);
    if (res.success && res.data?.replayed) {
      alert('Webhook replayed successfully!');
    } else {
      alert(`Replay returned status ${res.data?.webhook_status ?? 'error'}. Check your webhook_url.`);
    }
  };

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Header row — does not scroll */}
      <div className="flex items-center justify-between pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-forest-deep">Webhook Inspector</h1>
          <p className="text-xs text-graphite mt-0.5">
            Message content is private to clients. Admins see delivery metadata only.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
          {(['all', 'incoming', 'outgoing'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelectedMsg(null); }}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all capitalize ${
                filter === f ? 'bg-white text-forest-deep shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable message panels — each panel scrolls independently */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: message list */}
        <div className="lg:col-span-3 min-h-0 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-stone-400 text-xs">Loading...</div>
          ) : (
            <MessageList
              messages={msgs}
              selectedMsg={selectedMsg}
              onSelect={handleSelectMessage}
            />
          )}
        </div>

        {/* Right: detail panel */}
        <div className="lg:col-span-2 min-h-0 overflow-hidden flex flex-col">
          <MessageDetail
            message={selectedMsg}
            onReplay={handleReplay}
            isReplaying={replayingId === selectedMsg?.id}
          />
        </div>
      </div>
    </div>
  );
}