import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Users, Check } from 'lucide-react';

interface Contact {
  id: string;
  phone: string;
  name: string;
  tags: string;
}

interface ContactPickerProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
  allowNew: boolean;
  onAllowNewChange: (v: boolean) => void;
}

export function ContactPicker({ selectedIds, onToggle, allowNew, onAllowNewChange }: ContactPickerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await import('../../../../data/api/client').then(m => m.fetchApi<Contact[]>('/api/contacts'));
      if (res.success && res.data) setContacts(res.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const filtered = contacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  return (
    <div className="space-y-3 bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-yellow-400">Select Contacts</p>
        {selectedIds.length > 0 && (
          <span className="text-[10px] text-[#6e684a]">{selectedIds.length} selected</span>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6e684a]" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full bg-[#1a1915] border border-[#2d2813] rounded-lg pl-9 pr-3 py-2 text-white text-xs placeholder:text-[#5a554a] focus:border-yellow-500/50 outline-none" />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={16} className="animate-spin text-[#6e684a]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6">
          <Users size={24} className="mx-auto text-[#3d3823] mb-2" />
          <p className="text-xs text-[#6e684a]">No contacts found</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {filtered.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <button key={c.id} onClick={() => onToggle(c.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition text-left ${
                  isSelected ? 'bg-yellow-500/10 border border-yellow-500/20' : 'hover:bg-[#1a1915]'
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-yellow-400 bg-yellow-400' : 'border-[#3d3823]'}`}>
                  {isSelected && <Check size={10} className="text-black" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{c.name || 'Unknown'}</p>
                  <p className="text-[10px] text-[#6e684a] font-mono">{c.phone}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <label className="flex items-center gap-2 pt-2 border-t border-[#2d2813] cursor-pointer">
        <input type="checkbox" checked={allowNew} onChange={e => onAllowNewChange(e.target.checked)} className="accent-yellow-400" />
        <span className="text-[11px] text-[#a8a99e]">Also respond to new contacts not in this list</span>
      </label>
    </div>
  );
}
