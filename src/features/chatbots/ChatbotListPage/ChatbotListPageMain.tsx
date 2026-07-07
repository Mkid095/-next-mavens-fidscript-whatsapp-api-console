/**
 * ChatbotListPage — main list component (≤150 lines).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Search, BarChart3, MessageSquare, Zap } from 'lucide-react';
import { fetchApi } from '../../../services/api';
import type { Instance } from '../../../services/api';
import ChatbotCard, { type Chatbot, type BotHealth } from './ChatbotCard';

interface ChatbotListPageProps {
  clientToken: string;
  instances: Instance[];
}

export default function ChatbotListPage({ clientToken, instances }: ChatbotListPageProps) {
  const navigate = useNavigate();
  const [bots, setBots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [healthMap, setHealthMap] = useState<Record<string, BotHealth>>({});

  const loadBots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/platform/chatbots', {
        headers: { Authorization: `Bearer ${clientToken}` },
      }) as { success: boolean; data: Chatbot[] };
      if (data.success) {
        setBots(data.data);
        const healths = await Promise.all(
          data.data.map(bot =>
            fetchApi(`/api/platform/chatbots/${bot.id}/health`, {
              headers: { Authorization: `Bearer ${clientToken}` },
            }).then((r: unknown) => {
              const res = r as { success: boolean; data: BotHealth };
              return { [bot.id]: res.success ? res.data : null };
            }).catch(() => ({ [bot.id]: null }))
          )
        );
        const map: Record<string, BotHealth> = {};
        healths.forEach(h => Object.assign(map, h));
        setHealthMap(map);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [clientToken]);

  useEffect(() => { loadBots(); }, [loadBots]);

  const handleToggle = async (bot: Chatbot) => {
    await fetchApi(`/api/platform/chatbots/${bot.id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !bot.enabled }),
    });
    loadBots();
  };

  const handleDelete = async (botId: string) => {
    if (!confirm('Delete this chatbot? This cannot be undone.')) return;
    setDeletingId(botId);
    await fetchApi(`/api/platform/chatbots/${botId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    setDeletingId(null);
    loadBots();
  };

  const instanceMap = Object.fromEntries(instances.map(i => [i.id, i.name]));
  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(search.toLowerCase()) ||
    bot.description?.toLowerCase().includes(search.toLowerCase())
  );
  const activeBots = bots.filter(b => b.enabled).length;
  const totalContacts = bots.reduce((sum, b) => sum + (b.contact_count ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-yellow-400" />
            Chatbots
          </h1>
          <p className="text-sm text-[#8f834a] mt-1">
            Automate WhatsApp conversations with AI-powered chatbots
          </p>
        </div>
        <button
          onClick={() => navigate('/client/chatbots/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Chatbot
        </button>
      </div>

      {/* Stats bar */}
      {bots.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-4">
            <p className="text-xs text-[#6e684a] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Total
            </p>
            <p className="text-2xl font-bold text-white mt-1">{bots.length}</p>
          </div>
          <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-4">
            <p className="text-xs text-[#6e684a] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-green-400" /> Active
            </p>
            <p className="text-2xl font-bold text-green-400 mt-1">{activeBots}</p>
          </div>
          <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-4">
            <p className="text-xs text-[#6e684a] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Assigned Contacts
            </p>
            <p className="text-2xl font-bold text-white mt-1">{totalContacts.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Search */}
      {bots.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e684a] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chatbots..."
            className="w-full bg-[#1a1915] border border-[#2d2813] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none"
          />
        </div>
      )}

      {/* Bot list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full" />
        </div>
      ) : filteredBots.length === 0 && bots.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#2d2813] rounded-2xl">
          <Bot className="w-14 h-14 mx-auto mb-4 text-[#3d3823]" />
          <h3 className="text-lg font-bold text-white mb-1">No chatbots yet</h3>
          <p className="text-sm text-[#6e684a] mb-6 max-w-sm mx-auto">
            Create your first chatbot to automatically handle customer conversations on WhatsApp.
          </p>
          <button
            onClick={() => navigate('/client/chatbots/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create Your First Chatbot
          </button>
        </div>
      ) : filteredBots.length === 0 && search ? (
        <div className="text-center py-16 text-[#6e684a]">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>No chatbots matching "{search}"</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBots.map((bot) => (
            <ChatbotCard
              key={bot.id}
              bot={bot}
              healthMap={healthMap}
              instanceMap={instanceMap}
              onToggle={handleToggle}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
