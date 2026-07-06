/**
 * ContactsSection — thin shell.
 * Owns all contacts state; delegates rendering to sub-components.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Users } from 'lucide-react';
import { contactsApi } from '../../../../services/api';
import type { Client } from '../../../../services/api';
import ImportContactsModal from '../ImportContactsModal';
import AddContactModal from '../AddContactModal';
import ContactTable from './ContactTable';
import ContactFilters from './ContactFilters';
import ImportButton from './ImportButton';

interface ContactsSectionProps { client: Client; clientToken?: string; }
interface Contact { id: string; phone: string; name: string; created_at: string; }

export default function ContactsSection({ client, clientToken }: ContactsSectionProps) {
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
      if (res.success && res.data) setContacts(res.data);
    });
  }, [clientToken]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(searchQuery));
  }, [contacts, searchQuery]);

  const toggleContact = (id: string) =>
    setSelectedContacts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selectAll = () =>
    selectedContacts.size === contacts.length ? setSelectedContacts(new Set()) : setSelectedContacts(new Set(contacts.map(c => c.id)));

  const deleteContact = async (id: string) => {
    try {
      const res = await contactsApi.delete(id);
      if (res.success) {
        setContacts(prev => prev.filter(c => c.id !== id));
        setSelectedContacts(prev => { const n = new Set(prev); n.delete(id); return n; });
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

  const startEditing = (contact: Contact) => { setEditingId(contact.id); setEditingName(contact.name); };

  const saveEdit = async (id: string) => {
    if (!editingName.trim()) { setEditingId(null); return; }
    setSavingId(id);
    try {
      const res = await contactsApi.update(id, { name: editingName.trim() });
      if (res.success) setContacts(prev => prev.map(c => c.id === id ? { ...c, name: editingName.trim() } : c));
    } catch {}
    setSavingId(null);
    setEditingId(null);
  };

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
          <ImportButton
            selectedCount={selectedContacts.size}
            onDeleteSelected={deleteSelected}
            onShowImport={() => setShowImportModal(true)}
            onShowAdd={() => setShowAddModal(true)}
          />
        </div>
        <ContactFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} contacts={contacts} selectedContacts={selectedContacts} onSelectAll={selectAll} />
        <ContactTable
          filteredContacts={filteredContacts} contacts={contacts} selectedContacts={selectedContacts}
          editingId={editingId} editingName={editingName} savingId={savingId} searchQuery={searchQuery}
          onToggle={toggleContact} onStartEdit={startEditing} onSaveEdit={saveEdit}
          onCancelEdit={() => { setEditingId(null); setEditingName(''); }}
          onDeleteContact={deleteContact} onEditingNameChange={setEditingName}
        />
      </div>
      {showAddModal && <AddContactModal onClose={() => setShowAddModal(false)} onSaved={c => setContacts(p => [c, ...p])} existingPhones={existingPhones} />}
      {showImportModal && <ImportContactsModal onClose={() => setShowImportModal(false)} onContactsImported={ns => setContacts(p => [...ns, ...p])} existingPhones={existingPhones} />}
    </div>
  );
}
