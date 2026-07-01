import React, { useState, useEffect, useMemo } from 'react';
import { Users, FileUp, UserPlus, Trash2, Search, X, Pencil, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { contactsApi } from '../../../services/api';
import type { Client } from '../../../services/api';
import ImportContactsModal from './ImportContactsModal';
import AddContactModal from './AddContactModal';

interface ContactsSectionProps {
  client: Client;
  clientToken?: string;
}

interface Contact {
  id: string;
  phone: string;
  name: string;
  created_at: string;
}

export default function ContactsSection({
  client,
  clientToken,
}: ContactsSectionProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!clientToken) return;
    contactsApi.getAll().then((res) => {
      if (res.success && res.data) {
        setContacts(res.data);
      }
    });
  }, [clientToken]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(searchQuery)
    );
  }, [contacts, searchQuery]);

  const handleContactSaved = (contact: Contact) => {
    setContacts(prev => [contact, ...prev]);
  };

  const handleContactsImported = (newContacts: Contact[]) => {
    setContacts(prev => [...newContacts, ...prev]);
  };

  const toggleContact = (id: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedContacts.size === contacts.length) setSelectedContacts(new Set());
    else setSelectedContacts(new Set(contacts.map(c => c.id)));
  };

  const deleteContact = async (id: string) => {
    try {
      const res = await contactsApi.delete(id);
      if (res.success) {
        setContacts(prev => prev.filter(c => c.id !== id));
        setSelectedContacts(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch {}
  };

  const deleteSelected = async () => {
    if (selectedContacts.size === 0) return;
    const ids = Array.from(selectedContacts);
    try {
      await Promise.all(ids.map(id => contactsApi.delete(id)));
      setContacts(prev => prev.filter(c => !ids.includes(c.id)));
      setSelectedContacts(new Set());
    } catch {}
  };

  const startEditing = (contact: Contact) => {
    setEditingId(contact.id);
    setEditingName(contact.name);
  };

  const saveEdit = async (id: string) => {
    if (!editingName.trim()) { setEditingId(null); return; }
    setSavingId(id);
    try {
      const res = await contactsApi.update(id, { name: editingName.trim() });
      if (res.success) {
        setContacts(prev => prev.map(c => c.id === id ? { ...c, name: editingName.trim() } : c));
      }
    } catch {}
    setSavingId(null);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  // Normalized phone set for duplicate detection
  const existingPhones = new Set(contacts.map(c => c.phone.replace(/^\+/, '')));

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2813]">
          <div>
            <h3 className="text-sm font-bold text-[#a8a99e] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#eab308]" /> My Contacts
            </h3>
            <p className="text-xs text-[#6e684a] mt-0.5">
              {contacts.length} contacts saved
              {searchQuery && ` · ${filteredContacts.length} matching "${searchQuery}"`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedContacts.size > 0 && (
              <button
                onClick={deleteSelected}
                className="px-3 py-1.5 bg-red-900/30 text-red-400 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-red-900/50 transition-all border border-red-900/50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedContacts.size})
              </button>
            )}
            <button onClick={() => setShowImportModal(true)} className="px-3.5 py-1.5 bg-[#2d2813] text-[#a8a99e] text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#3d3a1e] transition-all border border-[#3d3a1e]">
              <FileUp className="w-3.5 h-3.5" /> Import
            </button>
            <button onClick={() => setShowAddModal(true)} className="px-3.5 py-1.5 bg-[#eab308] text-[#181711] text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-yellow-400 transition-all">
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {contacts.length > 0 && (
          <div className="flex items-center gap-2 py-3 border-b border-[#2d2813]">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl focus-within:border-[#eab308] transition-colors">
              <Search className="w-3.5 h-3.5 text-[#6e684a] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search contacts by name or phone…"
                className="flex-1 bg-transparent text-xs text-[#a8a99e] outline-none placeholder:text-[#6e684a]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#6e684a] hover:text-[#a8a99e]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {selectedContacts.size > 0 && (
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6e684a] cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={selectedContacts.size === contacts.length}
                  onChange={selectAll}
                  className="rounded border-[#2d2813] bg-[#181711]"
                />
                Select All
              </label>
            )}
          </div>
        )}

        <div className="divide-y divide-[#2d2813] max-h-[340px] overflow-y-auto mt-2">
          {filteredContacts.length > 0 ? filteredContacts.map((contact) => (
            <div key={contact.id} className="p-3 flex items-center gap-3 hover:bg-[#3d3a1e]/50 transition-all group">
              <input
                type="checkbox"
                checked={selectedContacts.has(contact.id)}
                onChange={() => toggleContact(contact.id)}
                className="rounded border-[#2d2813] bg-[#181711] shrink-0"
              />
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {/* Inline name editing */}
                {editingId === contact.id ? (
                  <div className="flex-1 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(contact.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                      className="flex-1 px-2 py-0.5 border border-[#eab308] rounded-lg text-xs text-[#a8a99e] outline-none bg-[#181711]"
                    />
                    <button
                      onClick={() => saveEdit(contact.id)}
                      disabled={savingId === contact.id}
                      className="p-1 rounded-lg bg-green-900/40 text-green-400 hover:bg-green-900/60 transition-colors disabled:opacity-50 border border-green-900/50"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 rounded-lg text-[#6e684a] hover:bg-[#2d2813] transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#a8a99e] truncate">{contact.name || contact.phone}</p>
                      <p className="text-[11px] text-[#6e684a] font-mono">{contact.phone}</p>
                    </div>
                    <button
                      onClick={() => startEditing(contact)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[#2d2813] text-[#6e684a] hover:text-[#eab308] transition-all shrink-0"
                      title="Edit name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => deleteContact(contact.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-900/30 text-red-500 transition-all shrink-0 border border-transparent hover:border-red-900/50"
                title="Delete contact"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )) : contacts.length === 0 ? (
            <div className="py-12 text-center text-[#6e684a] space-y-3">
              <Users className="w-10 h-10 text-[#6e684a] mx-auto" />
              <p className="font-bold text-[#a8a99e]">No contacts yet</p>
              <p className="text-[10px] text-[#6e684a]">Import contacts via CSV or phone list.</p>
              <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-[#eab308] text-[#181711] font-bold text-xs rounded-xl hover:bg-yellow-400 transition-all">
                Import Contacts
              </button>
            </div>
          ) : (
            <div className="py-8 text-center text-[#6e684a]">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No contacts match "{searchQuery}"</p>
              <button onClick={() => setSearchQuery('')} className="mt-1 text-xs text-[#eab308] hover:underline">
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddContactModal
            onClose={() => setShowAddModal(false)}
            onSaved={handleContactSaved}
            existingPhones={existingPhones}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <ImportContactsModal
            onClose={() => setShowImportModal(false)}
            onContactsImported={handleContactsImported}
            existingPhones={existingPhones}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
