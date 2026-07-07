import React from 'react';
import { Search } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function FilterBar({ searchQuery, onSearchChange }: FilterBarProps) {
  return (
    <div className="p-3 border-b border-[#2d2813]">
      <div className="flex items-center gap-2 bg-[#1a1915] border border-[#2d2813] rounded-lg px-3 py-2">
        <Search className="w-3.5 h-3.5 text-[#6e684a] shrink-0" />
        <input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search customers…"
          className="flex-1 bg-transparent text-xs text-white placeholder:text-[#5a554a] outline-none"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="text-[#5a554a] hover:text-white text-xs">✕</button>
        )}
      </div>
    </div>
  );
}
