import React from 'react';
import { Search, X } from 'lucide-react';

interface ContactFiltersProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  contacts: { id: string }[];
  selectedContacts: Set<string>;
  onSelectAll: () => void;
}

export default function ContactFilters({
  searchQuery,
  onSearchChange,
  contacts,
  selectedContacts,
  onSelectAll,
}: ContactFiltersProps) {
  if (contacts.length === 0) return null;
  return (
    <div className="flex items-center gap-2 py-3 border-b border-[#2d2813]">
      <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl focus-within:border-[#eab308] transition-colors">
        <Search className="w-3.5 h-3.5 text-[#6e684a] shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search contacts by name or phone…"
          className="flex-1 bg-transparent text-xs text-[#a8a99e] outline-none placeholder:text-[#6e684a]"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="text-[#6e684a] hover:text-[#a8a99e]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {selectedContacts.size > 0 && (
        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6e684a] cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={selectedContacts.size === contacts.length}
            onChange={onSelectAll}
            className="rounded border-[#2d2813] bg-[#181711]"
          />
          Select All
        </label>
      )}
    </div>
  );
}
