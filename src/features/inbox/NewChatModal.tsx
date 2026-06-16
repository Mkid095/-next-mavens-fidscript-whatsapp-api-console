import { useEffect, useState } from 'react';
import { X, Search, MessageSquarePlus } from 'lucide-react';
import { contactsApi } from '../../services/api';
import type { Contact } from '../../services/api';

// New-chat picker — start a thread with an already-saved contact. Lists the
// client's contacts (contactsApi), searchable. On pick, InboxPage either
// selects the existing conversation for that number or opens a fresh draft
// thread so the first message creates the conversation server-side.
interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (contact: Contact) => void;
}

export default function NewChatModal({ open, onClose, onPick }: NewChatModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    contactsApi.getAll().then((res) => {
      if (res.success && res.data) setContacts(res.data);
      setLoading(false);
    });
  }, [open]);

  if (!open) return null;

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? contacts.filter((c) => c.name.toLowerCase().includes(needle) || c.phone.includes(q.trim()))
    : contacts;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 p-4 pt-20" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-800">
            <MessageSquarePlus size={16} className="text-forest-deep" /> New chat
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-stone-700">
            <X size={16} />
          </button>
        </div>
        <div className="border-b border-stone-200 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
            <Search size={15} className="text-stone-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search saved contacts"
              className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && <p className="p-4 text-xs text-stone-400">Loading contacts…</p>}
          {!loading && filtered.length === 0 && (
            <p className="p-6 text-center text-xs text-stone-400">
              {contacts.length === 0 ? 'No saved contacts yet. Import contacts first.' : 'No matches.'}
            </p>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => { onPick(c); onClose(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-stone-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">
                {c.name.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800">{c.name}</p>
                <p className="truncate text-xs text-stone-400">{c.phone}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
