import React, { useState } from 'react';
import { Search, User, X, SendHorizontal } from 'lucide-react';
import type { Contact, Instance } from '../../services/api';
import { instancesApi } from '../../services/api';
import { TOKEN_COST } from '../../utils/tokenCosts';

interface ContactPickerPanelProps {
  contacts: Contact[];
  instance: Instance;
  to: string;
  onSend: (tokenCost: number) => void;
  onCancel: () => void;
}

export default function ContactPickerPanel({ contacts, instance, to, onSend, onCancel }: ContactPickerPanelProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const filtered = contacts.filter(c =>
    !search || c.phone.includes(search) || (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!selected) return;
    setSending(true); setError('');
    try {
      const contact = { fullName: selected.name || selected.phone, wuid: selected.phone.replace(/\D/g, ''), phoneNumber: selected.phone };
      const res = await instancesApi.sendContact(instance.name, to, contact);
      if (res.success) { onSend(TOKEN_COST.CONTACT); onCancel(); }
      else { setError(res.error || 'Failed to send'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div className="border-t border-[#eaebe4] bg-white p-3">
      <div className="flex items-start gap-2">
        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
          <User className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          {!selected ? (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filtered.length === 0 && <p className="text-xs text-stone-400 text-center py-3">No contacts found</p>}
                {filtered.map(c => (
                  <button key={c.id} onClick={() => setSelected(c)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-stone-50 flex items-center gap-2 text-left transition-all">
                    <div className="w-8 h-8 rounded-full bg-forest-deep text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {(c.name || c.phone).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-forest-deep truncate">{c.name || c.phone}</p>
                      <p className="text-[10px] text-stone-400 font-mono">{c.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-forest-deep text-white flex items-center justify-center text-xs font-bold">
                    {(selected.name || selected.phone).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-forest-deep">{selected.name || selected.phone}</p>
                    <p className="text-[10px] text-stone-400 font-mono">{selected.phone}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
              >
                {sending ? 'Sending...' : <><SendHorizontal className="w-3.5 h-3.5" /> Send Contact</>}
              </button>
            </>
          )}
          {error && <p className="text-[10px] text-red-500">{error}</p>}
          <button onClick={onCancel} className="w-full text-xs font-bold text-stone-400 hover:text-stone-600 py-1 transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
}
