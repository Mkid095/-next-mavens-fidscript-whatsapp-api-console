import React from 'react';
import { Search } from 'lucide-react';

interface ChatbotFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  botCount: number;
}

export default function ChatbotFilters({ search, onSearchChange, botCount }: ChatbotFiltersProps) {
  if (botCount === 0) return null;
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e684a] pointer-events-none" />
      <input
        type="text"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search chatbots..."
        className="w-full bg-[#1a1915] border border-[#2d2813] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none"
      />
    </div>
  );
}
