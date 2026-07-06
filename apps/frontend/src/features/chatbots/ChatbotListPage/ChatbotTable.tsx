import React from 'react';
import { ToggleRight, ToggleLeft, Trash2 } from 'lucide-react';
import type { Chatbot, BotHealth } from '../ChatbotListPage';

interface ChatbotTableProps {
  bots: Chatbot[];
  healthMap: Record<string, BotHealth>;
  instanceMap: Record<string, string>;
  deletingId: string | null;
  onToggle: (bot: Chatbot) => void;
  onDelete: (botId: string) => void;
  onEdit: (botId: string) => void;
}

export default function ChatbotTable({
  bots, healthMap, instanceMap, deletingId, onToggle, onDelete, onEdit,
}: ChatbotTableProps) {
  return (
    <div className="space-y-3">
      {bots.map((bot) => (
        <div
          key={bot.id}
          className="bg-[#1a1915] border border-[#2d2813] hover:border-[#3d3823] rounded-2xl p-5 transition group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <div
                  className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                    !bot.enabled ? 'bg-[#3d3823]' :
                    (healthMap[bot.id]?.enabledTriggers ?? 0) === 0 ? 'bg-yellow-400' :
                    !healthMap[bot.id]?.aiProvider ? 'bg-yellow-400' :
                    'bg-green-400'
                  }`}
                  title={
                    !bot.enabled ? 'Disabled' :
                    (healthMap[bot.id]?.enabledTriggers ?? 0) === 0 ? 'No triggers configured' :
                    !healthMap[bot.id]?.aiProvider ? 'AI not configured' :
                    'Healthy'
                  }
                />
                <h3 className="text-white font-bold text-base truncate">{bot.name}</h3>
                <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-[#2d2813] text-[#6e684a]">
                  {instanceMap[bot.instance_id] ?? 'Unknown container'}
                </span>
              </div>
              {bot.description && (
                <p className="text-sm text-[#6e684a] truncate ml-5">{bot.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 ml-5 text-xs text-[#5a554a]">
                <span>{bot.trigger_count ?? 0} triggers</span>
                <span>{bot.contact_count ?? 0} contacts</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onToggle(bot)}
                className="text-[#6e684a] hover:text-white transition"
                title={bot.enabled ? 'Disable' : 'Enable'}
              >
                {bot.enabled
                  ? <ToggleRight className="w-6 h-6 text-green-400" />
                  : <ToggleLeft className="w-6 h-6" />}
              </button>
              <button
                onClick={() => onEdit(bot.id)}
                className="px-3.5 py-1.5 bg-[#2d2813] hover:bg-[#3d3823] rounded-lg text-xs text-[#a8a99e] hover:text-white transition"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(bot.id)}
                disabled={deletingId === bot.id}
                className="text-[#5a554a] hover:text-red-400 transition p-1.5"
                title="Delete"
              >
                {deletingId === bot.id ? (
                  <div className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
