import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface Props {
  botName: string;
}

export default function TopBar({ botName }: Props) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2d2813] shrink-0">
      <button onClick={() => navigate('/client/chatbots')}
        className="flex items-center gap-1.5 text-sm text-[#6e684a] hover:text-white transition">
        <ArrowLeft className="w-4 h-4" />Chatbots
      </button>
      <span className="text-white">/</span>
      <span className="text-sm font-bold text-white">{botName || '…'}</span>
      <span className="ml-auto text-xs text-[#6e684a]">Inspector</span>
    </div>
  );
}
