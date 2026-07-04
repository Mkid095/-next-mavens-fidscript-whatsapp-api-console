/**
 * ChatbotsView — chatbot list page.
 *
 * Shows all chatbots for the workspace. Click a bot to open the
 * ChatbotBuilderShell (the single editor). No inline detail panel.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../../services/api';
import type { Instance } from '../../../services/api';
import { Bot, Plus, Trash2, ToggleLeft, ToggleRight, ChevronRight, Loader2, Search } from 'lucide-react';

interface Chatbot {
  id: string;
  name: string;
  description: string;
  instance_id: string;
  enabled: number;
  priority: number;
  trigger_count?: number;
  contact_count?: number;
  created_at: string;
}

interface ChatbotsViewProps {
  clientToken: string;
  instances: Instance[];
}

export default function ChatbotsView({ clientToken, instances }: ChatbotsViewProps) {
  const navigate = useNavigate();
  const [bots, setBots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const instanceMap: Record<string, string> = {};
  for (const inst of instances) {
    instanceMap[inst.id] = inst.name;
  }

  const loadBots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/platform/chatbots', {
        headers: { Authorization: `Bearer ${clientToken}` },
      }) as { success: boolean; data: Chatbot[] };
      if (data.success) setBots(data.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [clientToken]);

  useEffect(() => { loadBots(); }, [loadBots]);

  const handleToggle = async (bot: Chatbot): Promise<void> => {
    await fetchApi(`/api/platform/chatbots/${bot.id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !bot.enabled }),
    });
    loadBots();
  };

  const handleDelete = async (botId: string): Promise<void> => {
    await fetchApi(`/api/platform/chatbots/${botId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    setConfirmDelete(null);
    loadBots();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#6e684a]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading chatbots…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#cbd3cf] flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-yellow-500" /> Chatbots
          </h3>
          <p className="text-xs text-[#6e684a] mt-0.5">
            {bots.length} bot{bots.length !== 1 ? 's' : ''} · Click to edit in the builder
          </p>
        </div>
        <button
          onClick={() => navigate('/client/chatbots/new')}
          className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] text-xs font-bold rounded-xl transition"
        >
          <Plus className="w-3.5 h-3.5" /> New Chatbot
        </button>
      </div>

      {/* Bot list */}
      {bots.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[#2d2813] rounded-2xl">
          <Bot className="w-10 h-10 mx-auto mb-3 text-[#3d3813]" />
          <p className="text-sm font-semibold text-[#6e684a]">No chatbots yet</p>
          <p className="text-xs text-[#5a554a] mt-1 mb-4">Create your first AI chatbot to automate WhatsApp conversations.</p>
          <button
            onClick={() => navigate('/client/chatbots/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] text-xs font-bold rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" /> Create Chatbot
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="group flex items-center gap-3 p-4 bg-[#1a1915] border border-[#2d2813] rounded-xl hover:border-yellow-500/20 transition cursor-pointer"
              onClick={() => navigate(`/client/chatbots/${bot.id}`)}
            >
              {/* Bot icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                bot.enabled ? 'bg-yellow-500/10' : 'bg-[#181711]'
              }`}>
                <Bot className={`w-5 h-5 ${bot.enabled ? 'text-yellow-400' : 'text-[#5a554a]'}`} />
              </div>

              {/* Bot info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#cbd3cf] truncate">{bot.name}</p>
                  {bot.enabled ? (
                    <span className="shrink-0 px-1.5 py-0.5 bg-green-900/30 text-green-400 border border-green-900/40 text-[9px] font-bold rounded-full uppercase">
                      Active
                    </span>
                  ) : (
                    <span className="shrink-0 px-1.5 py-0.5 bg-[#2d2813] text-[#6e684a] text-[9px] font-bold rounded-full uppercase">
                      Disabled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-[11px] text-[#6e684a] truncate">
                    📱 {instanceMap[bot.instance_id] ?? bot.instance_id.slice(0, 12)}
                  </p>
                  {bot.trigger_count !== undefined && bot.trigger_count > 0 && (
                    <p className="text-[10px] text-[#5a554a]">
                      ⚡ {bot.trigger_count} trigger{bot.trigger_count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggle(bot); }}
                  className="p-1.5 text-[#6e684a] hover:text-white transition"
                  title={bot.enabled ? 'Disable' : 'Enable'}
                >
                  {bot.enabled
                    ? <ToggleRight className="w-5 h-5 text-green-400" />
                    : <ToggleLeft className="w-5 h-5" />}
                </button>

                {/* Inspect conversations */}
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/client/chatbots/${bot.id}/inspector`); }}
                  className="p-1.5 text-[#6e684a] hover:text-yellow-400 transition opacity-0 group-hover:opacity-100"
                  title="Inspect conversations"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Delete */}
                {confirmDelete === bot.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(bot.id)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold rounded-lg"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-2 py-1 text-[#6e684a] hover:text-white text-[9px] font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(bot.id); }}
                    className="p-1.5 text-[#6e684a] hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Open builder */}
                <ChevronRight className="w-4 h-4 text-[#5a554a] group-hover:text-yellow-400 transition" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}