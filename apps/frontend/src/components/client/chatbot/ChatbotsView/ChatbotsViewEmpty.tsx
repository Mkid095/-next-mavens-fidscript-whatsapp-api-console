import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus } from 'lucide-react';

export default function ChatbotsViewEmpty() {
  const navigate = useNavigate();

  return (
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
  );
}
