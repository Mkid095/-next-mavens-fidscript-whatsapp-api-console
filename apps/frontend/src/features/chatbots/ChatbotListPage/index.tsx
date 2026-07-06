/**
 * ChatbotListPage — thin shell.
 * Shows all chatbots with stats, search, and quick actions.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Plus } from 'lucide-react';
import { fetchApi } from '../../../services/api';
import type { Instance } from '../../../services/api';
import ChatbotFilters from './ChatbotFilters';
import ChatbotTable from './ChatbotTable';
import StatsBar from './StatsBar';
import EmptyState from './EmptyState';

export interface Chatbot {
  id: string; name: string; description: string; instance_id: string;
  enabled: number; priority: number;
  trigger_count?: number; contact_count?: number; created_at: string;
}
export interface BotHealth {
  activeKnowledgeSources: number; enabledTools: number; enabledTriggers: number;
  lastTestSession: string | null; aiProvider: string | null; aiModel: string | null;
}
interface ChatbotListPageProps { clientToken: string; instances: Instance[]; }

export default function ChatbotListPage({ clientToken, instances }: ChatbotListPageProps) {
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
      method: 'DELETE', headers: { Authorization: `Bearer ${clientToken}` },
    });
    setDeletingId(null);
    loadBots();
  };

  const instanceMap = Object.fromEntries(instances.map(i => [i.id, i.name]));
  const filteredBots = bots.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.description?.toLowerCase().includes(search.toLowerCase())
  );
  const activeBots = bots.filter(b => b.enabled).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-yellow-400" /> Chatbots
          </h1>
          <p className="text-sm text-[#8f834a] mt-1">Automate WhatsApp conversations with AI-powered chatbots</p>
        </div>
        <button onClick={() => window.location.href = '/client/chatbots/new'}
          className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition shrink-0">
          <Plus className="w-4 h-4" /> New Chatbot
        </button>
      </div>

      {bots.length > 0 && <StatsBar bots={bots} activeBots={activeBots} />}
      <ChatbotFilters search={search} onSearchChange={setSearch} botCount={bots.length} />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full" />
        </div>
      ) : filteredBots.length === 0 && bots.length === 0 ? (
        <EmptyState hasSearch={false} search="" />
      ) : filteredBots.length === 0 && !!search ? (
        <EmptyState hasSearch={true} search={search} />
      ) : (
        <ChatbotTable
          bots={filteredBots} healthMap={healthMap} instanceMap={instanceMap}
          deletingId={deletingId} onToggle={handleToggle} onDelete={handleDelete}
          onEdit={id => { window.location.href = `/client/chatbots/${id}/edit`; }}
        />
      )}
    </div>
  );
}
