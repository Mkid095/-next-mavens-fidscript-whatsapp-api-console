import React, { useState, useEffect } from 'react';
import { Send, History, Clock, CheckCircle, XCircle } from 'lucide-react';
import { clientMessagesApi } from '../../services/api';
import type { ClientMessage } from '../../services/api';

interface MessagesSectionProps {
  clientToken?: string;
}

interface QueueMessage {
  id: string;
  phone: string;
  message?: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

export default function MessagesSection({ clientToken }: MessagesSectionProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'api-history' | 'platform-history'>('queue');
  const [queue, setQueue] = useState<QueueMessage[]>([]);

  useEffect(() => {
    if (!clientToken) return;
    clientMessagesApi.getAll().then((res) => {
      if (res.success && res.data) {
        setQueue(res.data.map((m: ClientMessage) => ({
          id: m.id,
          phone: m.from_number,
          message: m.content,
          status: m.is_read ? 'sent' : 'pending',
          created_at: m.timestamp,
        })));
      }
    });
  }, [clientToken]);

  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-1.5 p-1.5 bg-[#f9f9f2] border-b border-[#eaebe4]">
        {(['queue', 'api-history', 'platform-history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab ? 'bg-forest-deep text-white' : 'text-stone-600 hover:text-black hover:bg-stone-100'
            }`}
          >
            {tab === 'queue' ? 'Message Queue' : tab === 'api-history' ? 'API History' : 'Platform History'}
          </button>
        ))}
      </div>

      <div className="divide-y divide-stone-100 max-h-[500px] overflow-y-auto">
        {activeTab === 'queue' && (
          queue.length > 0 ? queue.map((msg) => (
            <div key={msg.id} className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono font-bold text-forest-deep">{msg.phone}</code>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                    msg.status === 'sent' ? 'bg-green-100 text-green-800' :
                    msg.status === 'pending' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                    'bg-red-100 text-red-600'
                  }`}>{msg.status}</span>
                </div>
                <p className="text-[11px] text-graphite truncate max-w-md">{msg.message}</p>
                <p className="text-[10px] text-stone-400">{msg.created_at}</p>
              </div>
              <div className="flex items-center gap-2">
                {msg.status === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                {msg.status === 'sent' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {msg.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-graphite space-y-2">
              <Send className="w-8 h-8 text-yellow-300 mx-auto" />
              <p className="font-bold text-xs text-forest-deep">No messages in queue</p>
              <p className="text-[10px] text-graphite">Use Bulk Messaging to send messages to your contacts.</p>
            </div>
          )
        )}

        {activeTab === 'api-history' && (
          <div className="p-12 text-center text-graphite space-y-2">
            <History className="w-8 h-8 text-yellow-300 mx-auto" />
            <p className="font-bold text-xs text-forest-deep">No API messages yet</p>
            <p className="text-[10px] text-graphite">Messages sent via API will appear here.</p>
          </div>
        )}

        {activeTab === 'platform-history' && (
          <div className="p-12 text-center text-graphite space-y-2">
            <History className="w-8 h-8 text-yellow-300 mx-auto" />
            <p className="font-bold text-xs text-forest-deep">No platform messages yet</p>
            <p className="text-[10px] text-graphite">Messages sent through the bulk messaging platform will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
