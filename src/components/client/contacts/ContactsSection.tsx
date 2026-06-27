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
      <div className="bg-white border border-[#eaebe4] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5">
              <Users className="w-4 h-4 text-yellow-700" /> My Contacts
            </h3>
            <p className="text-xs text-graphite mt-0.5">
              {contacts.length} contacts saved
              {searchQuery && ` · ${filteredContacts.length} matching "${searchQuery}"`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedContacts.size > 0 && (
              <button
                onClick={deleteSelected}
                className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedContacts.size})
              </button>
            )}
            <button onClick={() => setShowImportModal(true)} className="px-3.5 py-1.5 bg-forest-deep text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5" /> Import
            </button>
            <button onClick={() => setShowAddModal(true)} className="px-3.5 py-1.5 bg-yellow-500 text-stone-950 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {contacts.length > 0 && (
          <div className="flex items-center gap-2 py-3 border-b border-stone-100">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-stone-50 border border-[#eaebe4] rounded-xl">
              <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search contacts by name or phone…"
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-stone-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {selectedContacts.size > 0 && (
              <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={selectedContacts.size === contacts.length}
                  onChange={selectAll}
                  className="rounded border-stone-300"
                />
                Select All
              </label>
            )}
          </div>
        )}

        <div className="divide-y divide-stone-100 max-h-[340px] overflow-y-auto mt-2">
          {filteredContacts.length > 0 ? filteredContacts.map((contact) => (
            <div key={contact.id} className="p-3 flex items-center gap-3 hover:bg-stone-50/50 transition-all group">
              <input
                type="checkbox"
                checked={selectedContacts.has(contact.id)}
                onChange={() => toggleContact(contact.id)}
                className="rounded border-stone-300 shrink-0"
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
                      className="flex-1 px-2 py-0.5 border border-forest-deep rounded-lg text-xs text-forest-deep outline-none bg-white"
                    />
                    <button
                      onClick={() => saveEdit(contact.id)}
                      disabled={savingId === contact.id}
                      className="p-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-forest-deep truncate">{contact.name}</p>
                      <p className="text-[11px] text-stone-500 font-mono">{contact.phone}</p>
                    </div>
                    <button
                      onClick={() => startEditing(contact)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-forest-deep transition-all shrink-0"
                      title="Edit name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => deleteContact(contact.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-all shrink-0"
                title="Delete contact"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )) : contacts.length === 0 ? (
            <div className="py-12 text-center text-graphite space-y-3">
              <Users className="w-10 h-10 text-yellow-300 mx-auto" />
              <p className="font-bold text-forest-deep">No contacts yet</p>
              <p className="text-[10px] text-graphite">Import contacts via CSV or phone list.</p>
              <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-yellow-500 text-stone-950 font-bold text-xs rounded-xl">
                Import Contacts
              </button>
            </div>
          ) : (
            <div className="py-8 text-center text-stone-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No contacts match "{searchQuery}"</p>
              <button onClick={() => setSearchQuery('')} className="mt-1 text-xs text-forest-deep hover:underline">
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
