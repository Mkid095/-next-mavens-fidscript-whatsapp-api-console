import React from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';

interface Contact {
  id: string;
  phone: string;
  name: string;
  created_at: string;
}

interface ContactTableProps {
  filteredContacts: Contact[];
  contacts: Contact[];
  selectedContacts: Set<string>;
  editingId: string | null;
  editingName: string;
  savingId: string | null;
  searchQuery: string;
  onToggle: (id: string) => void;
  onStartEdit: (contact: Contact) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDeleteContact: (id: string) => void;
  onEditingNameChange: (v: string) => void;
}

export default function ContactTable({
  filteredContacts,
  contacts,
  selectedContacts,
  editingId,
  editingName,
  savingId,
  searchQuery,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteContact,
  onEditingNameChange,
}: ContactTableProps) {
  return (
    <div className="divide-y divide-[#2d2813] max-h-[340px] overflow-y-auto mt-2">
      {filteredContacts.length > 0 ? filteredContacts.map((contact) => (
        <div key={contact.id} className="p-3 flex items-center gap-3 hover:bg-[#3d3a1e]/50 transition-all group">
          <input
            type="checkbox"
            checked={selectedContacts.has(contact.id)}
            onChange={() => onToggle(contact.id)}
            className="rounded border-[#2d2813] bg-[#181711] shrink-0"
          />
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {editingId === contact.id ? (
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="text"
                  value={editingName}
                  onChange={e => onEditingNameChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') onSaveEdit(contact.id);
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                  autoFocus
                  className="flex-1 px-2 py-0.5 border border-[#eab308] rounded-lg text-xs text-[#a8a99e] outline-none bg-[#181711]"
                />
                <button
                  onClick={() => onSaveEdit(contact.id)}
                  disabled={savingId === contact.id}
                  className="p-1 rounded-lg bg-green-900/40 text-green-400 hover:bg-green-900/60 transition-colors disabled:opacity-50 border border-green-900/50"
                  title="Save"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onCancelEdit}
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
                  onClick={() => onStartEdit(contact)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[#2d2813] text-[#6e684a] hover:text-[#eab308] transition-all shrink-0"
                  title="Edit name"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => onDeleteContact(contact.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-900/30 text-red-500 transition-all shrink-0 border border-transparent hover:border-red-900/50"
            title="Delete contact"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )) : contacts.length === 0 ? (
        <div className="py-12 text-center text-[#6e684a] space-y-3">
          <p className="font-bold text-[#a8a99e]">No contacts yet</p>
          <p className="text-[10px] text-[#6e684a]">Import contacts via CSV or phone list.</p>
        </div>
      ) : (
        <div className="py-8 text-center text-[#6e684a]">
          <p className="text-xs">No contacts match "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
