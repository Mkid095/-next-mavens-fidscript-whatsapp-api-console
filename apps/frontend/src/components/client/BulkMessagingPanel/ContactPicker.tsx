import { Search, X, Plus, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Contact } from '../../../services/api';

interface ContactPickerProps {
  selectedContacts: Set<string>;
  onToggleContact: (phone: string) => void;
  savedContacts: Contact[];
  phoneInput: string;
  onPhoneInputChange: (v: string) => void;
  extraPhones: string[];
  onAddPhone: () => void;
  onRemovePhone: (p: string) => void;
}

export default function ContactPicker({
  selectedContacts, onToggleContact, savedContacts,
  phoneInput, onPhoneInputChange, extraPhones, onAddPhone, onRemovePhone,
}: ContactPickerProps) {
  const [contactSearch, setContactSearch] = useState('');
  const [showAllContacts, setShowAllContacts] = useState(false);

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return savedContacts;
    const q = contactSearch.toLowerCase();
    return savedContacts.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(contactSearch)
    );
  }, [savedContacts, contactSearch]);

  const DISPLAY_LIMIT = 20;
  const displayedContacts = showAllContacts ? filteredContacts : filteredContacts.slice(0, DISPLAY_LIMIT);
  const hasMoreContacts = filteredContacts.length > DISPLAY_LIMIT;

  return (
    <div className="space-y-2">
      <label className="block text-[9px] font-bold text-[#6e684a] uppercase mb-1">Recipients</label>

      {selectedContacts.size > 0 && (
        <div className="flex flex-wrap gap-1 min-h-[24px]">
          {Array.from(selectedContacts).map(phone => {
            const contact = savedContacts.find(c => c.phone === phone);
            return (
              <span key={phone} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#eab308] text-[#181711] text-[10px] rounded-full">
                <span className="max-w-[100px] truncate">{contact?.name || phone}</span>
                <button onClick={() => onToggleContact(phone)} className="hover:bg-[#181711]/20 rounded-full p-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-1 px-2 py-1.5 bg-[#181711] border border-[#2d2813] rounded-xl">
        <Search className="w-3 h-3 text-[#6e684a] shrink-0" />
        <input
          type="text"
          value={contactSearch}
          onChange={e => { setContactSearch(e.target.value); setShowAllContacts(false); }}
          placeholder="Search contacts…"
          className="flex-1 bg-transparent text-[10px] text-[#a8a99e] outline-none placeholder:text-[#5a554a]"
        />
        {contactSearch && (
          <button onClick={() => setContactSearch('')} className="text-[#6e684a] hover:text-[#a8a99e]">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {filteredContacts.length > 0 && (
        <p className="text-[9px] text-[#6e684a]">
          {filteredContacts.length} contact{filteredContacts.length === 1 ? '' : 's'} found
          {contactSearch && ` matching "${contactSearch}"`}
        </p>
      )}

      {savedContacts.length > 0 ? (
        <>
          <div className="max-h-40 overflow-y-auto border border-[#2d2813] rounded-xl divide-y divide-[#2d2813]/50">
            {displayedContacts.map(c => (
              <label key={c.id} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#181711]/50 cursor-pointer text-[10px]">
                <input
                  type="checkbox" checked={selectedContacts.has(c.phone)}
                  onChange={() => onToggleContact(c.phone)}
                  className="rounded border-[#2d2813] text-[#eab308] focus:ring-[#eab308]"
                />
                <span className="flex-1 truncate text-[#a8a99e]">{c.name}</span>
                <span className="font-mono text-[#6e684a]">{c.phone}</span>
              </label>
            ))}
          </div>
          {hasMoreContacts && !showAllContacts && (
            <button
              onClick={() => setShowAllContacts(true)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-[#eab308] hover:bg-[#181711]/50 rounded-lg font-medium transition-colors"
            >
              Show {filteredContacts.length - DISPLAY_LIMIT} more <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </>
      ) : (
        <p className="text-[10px] text-[#6e684a] italic">No saved contacts. Add phone numbers below.</p>
      )}

      <div className="flex items-center gap-1.5">
        <input
          type="tel" value={phoneInput} onChange={e => onPhoneInputChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAddPhone()}
          placeholder="+254712345678"
          className="flex-1 px-3 py-1.5 border border-[#2d2813] bg-[#181711] rounded-xl text-xs font-mono text-[#a8a99e] placeholder:text-[#5a554a] focus:outline-none focus:border-[#eab308]"
        />
        <button onClick={onAddPhone} className="px-3 py-1.5 bg-[#2d2813] hover:bg-[#3d3a1e] text-[#a8a99e] rounded-xl text-[10px] font-bold transition-all">
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {extraPhones.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {extraPhones.map(p => (
            <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2d2813] text-[#a8a99e] text-[10px] font-mono rounded-full">
              {p}
              <button onClick={() => onRemovePhone(p)}><X className="w-2.5 h-2.5 text-[#6e684a]" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
