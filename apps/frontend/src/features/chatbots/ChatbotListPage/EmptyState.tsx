import React from 'react';
import { Bot, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  hasSearch: boolean;
  search: string;
}

export default function EmptyState({ hasSearch, search }: EmptyStateProps) {
  const navigate = useNavigate();
  if (hasSearch) {
    return (
      <div className="text-center py-16 text-[#6e684a]">
        <p>No chatbots matching "{search}"</p>
      </div>
    );
  }
  return (
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
  );
}
