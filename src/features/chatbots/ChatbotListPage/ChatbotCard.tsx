/**
 * ChatbotCard — individual chatbot card for the list view.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleRight, ToggleLeft, Trash2 } from 'lucide-react';

export interface BotHealth {
  activeKnowledgeSources: number;
  enabledTools: number;
  enabledTriggers: number;
  lastTestSession: string | null;
  aiProvider: string | null;
  aiModel: string | null;
}

export interface Chatbot {
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

interface ChatbotCardProps {
  bot: Chatbot;
  healthMap: Record<string, BotHealth>;
  instanceMap: Record<string, string>;
  onToggle: (bot: Chatbot) => void;
  onDelete: (botId: string) => void;
  deletingId: string | null;
}

export default function ChatbotCard({
  bot,
  healthMap,
  instanceMap,
  onToggle,
  onDelete,
  deletingId,
}: ChatbotCardProps) {
  const navigate = useNavigate();
  const health = healthMap[bot.id];

  const statusDot = !bot.enabled
    ? { color: 'bg-[#3d3823]', title: 'Disabled' }
    : (health?.enabledTriggers ?? 0) === 0
    ? { color: 'bg-yellow-400', title: 'No triggers configured' }
    : !health?.aiProvider
    ? { color: 'bg-yellow-400', title: 'AI not configured' }
    : { color: 'bg-green-400', title: 'Healthy' };

  return (
    <div className="bg-[#1a1915] border border-[#2d2813] hover:border-[#3d3823] rounded-2xl p-5 transition group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`w-2 h-2 rounded-full mt-1 shrink-0 ${statusDot.color}`}
              title={statusDot.title}
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
            <span className="flex items-center gap-1">
              <span>⚡</span> {bot.trigger_count ?? 0} triggers
            </span>
            <span className="flex items-center gap-1">
              <span>💬</span> {bot.contact_count ?? 0} contacts
            </span>
          </div>
        </div>

        {/* Actions */}
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
            onClick={() => navigate(`/client/chatbots/${bot.id}/edit`)}
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
  );
}
