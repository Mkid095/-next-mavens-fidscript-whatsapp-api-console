import React, { useState, useEffect } from 'react';
import { Users, FileUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { contactsApi } from '../../../services/api';
import type { Client } from '../../../services/api';
import ImportContactsModal from './ImportContactsModal';
import BulkMessagePanel from './BulkMessagePanel';

interface ContactsSectionProps {
  client: Client;
  clientToken?: string;
  tokenBalance: number;
  onTokenDeduct: (n: number) => void;
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
  tokenBalance,
  onTokenDeduct,
}: ContactsSectionProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (!clientToken) return;
    contactsApi.getAll().then((res) => {
      if (res.success && res.data) {
        setContacts(res.data);
      }
    });
  }, [clientToken]);

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

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#eaebe4] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5"><Users className="w-4 h-4 text-yellow-700" /> My Contacts</h3>
            <p className="text-xs text-graphite mt-0.5">{contacts.length} contacts saved.</p>
          </div>
          <button onClick={() => setShowImportModal(true)} className="px-3.5 py-1.5 bg-forest-deep text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
            <FileUp className="w-3.5 h-3.5" /> Import Contacts
          </button>
        </div>

        {contacts.length > 0 && (
          <div className="flex items-center justify-between py-3 border-b border-stone-100">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedContacts.size === contacts.length && contacts.length > 0}
                onChange={selectAll}
                className="rounded border-stone-300"
              />
              Select All ({selectedContacts.size} selected)
            </label>
            <p className="text-[10px] text-stone-400">{selectedContacts.size > 0 ? `${selectedContacts.size} selected` : 'None selected'}</p>
          </div>
        )}

        <div className="divide-y divide-stone-100 max-h-[300px] overflow-y-auto mt-2">
          {contacts.length > 0 ? contacts.map((contact) => (
            <div key={contact.id} className="p-3 flex items-center gap-3 hover:bg-stone-50/50 transition-all">
              <input
                type="checkbox"
                checked={selectedContacts.has(contact.id)}
                onChange={() => toggleContact(contact.id)}
                className="rounded border-stone-300 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-forest-deep truncate">{contact.name}</p>
                <p className="text-[11px] text-stone-500 font-mono">{contact.phone}</p>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center text-graphite space-y-3">
              <Users className="w-10 h-10 text-yellow-300 mx-auto" />
              <p className="font-bold text-forest-deep">No contacts yet</p>
              <p className="text-[10px] text-graphite">Import contacts via CSV or phone list.</p>
              <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-yellow-500 text-stone-950 font-bold text-xs rounded-xl">
                Import Contacts
              </button>
            </div>
          )}
        </div>
      </div>

      {contacts.length > 0 && (
        <BulkMessagePanel
          contacts={contacts}
          selectedContacts={selectedContacts}
          tokenBalance={tokenBalance}
          onTokenDeduct={onTokenDeduct}
        />
      )}

      <AnimatePresence>
        {showImportModal && (
          <ImportContactsModal
            onClose={() => setShowImportModal(false)}
            onContactsImported={handleContactsImported}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
