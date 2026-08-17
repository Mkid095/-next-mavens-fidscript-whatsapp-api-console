import { useEffect, useMemo, useState } from 'react';
import { MessageSquarePlus, Search, X } from 'lucide-react';
import { contactsApi } from '../../services/contacts';
import { phoneToJid } from './messagesApi';
import type { ChatListItem } from './messagesApi';

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (chat: ChatListItem) => void;
}

// New-chat picker - start a 1:1 thread with a saved contact. Wraps the
// contact's phone into a JID and synthesises a minimal ChatListItem so the
// caller can open the thread immediately (the real chat will arrive on the
// next chat-list refresh).
export default function NewChatModal({ open, onClose, onPick }: NewChatModalProps) {
  const [q, setQ] = useState('');
  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    contactsApi.getAll().then((res) => {
      setLoading(false);
      if (res.success && res.data) setContacts(res.data);
    });
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(needle) || c.phone.includes(q.trim()));
  }, [contacts, q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#2d2813] bg-[#1a1915] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#2d2813] px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <MessageSquarePlus size={16} className="text-[#eab308]" /> New chat
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-[#6e684a] hover:text-[#a8a99e]">
            <X size={16} />
          </button>
        </div>
        <div className="border-b border-[#2d2813] p-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#2d2813] bg-[#181711] px-3 py-2 focus-within:border-[#eab308]/50">
            <Search size={14} className="text-[#6e684a]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search saved contacts"
              className="w-full bg-transparent text-sm text-[#a8a99e] outline-none placeholder:text-[#6e684a]"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && <p className="p-4 text-xs text-[#6e684a]">Loading contacts…</p>}
          {!loading && filtered.length === 0 && (
            <p className="p-6 text-center text-xs text-[#6e684a]">
              {contacts.length === 0 ? 'No saved contacts yet. Import contacts first.' : 'No matches.'}
            </p>
          )}
          {filtered.map((c) => {
            const jid = phoneToJid(c.phone);
            const initial = (c.name || '?').charAt(0).toUpperCase();
            return (
              <button
                key={c.id}
                onClick={() => {
                  if (!jid) return;
                  onPick({
                    jid,
                    name: c.name,
                    isGroup: false,
                    lastMessage: '',
                    lastMessageAt: null,
                    unread: 0,
                    profilePic: null,
                    aiMode: null,
                    isRestricted: false,
                    isAdmin: false,
                  });
                  onClose();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[#2d2813]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2d2813] text-xs font-bold text-[#8f834a]">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#a8a99e]">{c.name}</p>
                  <p className="truncate text-xs text-[#6e684a]">{c.phone}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}