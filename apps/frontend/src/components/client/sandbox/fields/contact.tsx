import { Plus, Trash2 } from 'lucide-react';
import type { SandboxField, SandboxContact, SandboxContactItem } from '../types.js';

export function ContactArrayField({
  subFields, contactItems, onContactItemsChange, contacts,
}: {
  subFields: SandboxField[];
  contactItems: SandboxContactItem[];
  onContactItemsChange: (next: SandboxContactItem[]) => void;
  contacts: SandboxContact[];
}) {
  return (
    <div className="space-y-2">
      {contactItems.map((item, i) => (
        <div key={i} className="p-3 border border-[#2d2813] rounded-xl space-y-2 bg-[#181711]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6e684a]">Contact {i + 1}</span>
            {contactItems.length > 1 && (
              <button onClick={() => onContactItemsChange(contactItems.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:text-red-300">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {subFields.map(sub => (
            <div key={sub.key}>
              <label className="block text-[9px] font-bold text-[#6e684a] mb-0.5">{sub.label}</label>
              <input
                type="text"
                value={item[sub.key as keyof SandboxContactItem] || ''}
                onChange={e => onContactItemsChange(contactItems.map((c, j) => j === i ? { ...c, [sub.key]: e.target.value } : c))}
                placeholder={sub.placeholder || sub.label}
                className="w-full px-2.5 py-1.5 border border-[#2d2813] rounded-lg text-xs font-mono focus:outline-none focus:border-yellow-500 bg-[#181711] text-[#a8a99e]"
              />
            </div>
          ))}
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button onClick={() => onContactItemsChange([...contactItems, { fullName: '', phoneNumber: '' }])} className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300">
          <Plus className="w-3 h-3" /> Add contact
        </button>
        {contacts.length > 0 && (
          <select
            onChange={e => {
              const c = contacts.find(ct => ct.id === e.target.value);
              if (c) onContactItemsChange([...contactItems, { fullName: c.name, phoneNumber: c.phone }]);
            }}
            className="px-2 py-1.5 border border-[#2d2813] rounded-lg text-xs text-[#a8a99e] focus:outline-none focus:border-yellow-500 bg-[#181711]"
          >
            <option value="">+ From contacts list</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

export function ContactPickerField({
  fieldKey, bodyValues, onBodyValuesChange, contacts, onAddContact,
}: {
  fieldKey: string;
  bodyValues: Record<string, string>;
  onBodyValuesChange: (next: Record<string, string>) => void;
  contacts: SandboxContact[];
  onAddContact: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <select
        value={bodyValues[fieldKey] || ''}
        onChange={e => onBodyValuesChange({ ...bodyValues, [fieldKey]: e.target.value })}
        className="w-full px-3 py-2 border border-[#2d2813] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500 bg-[#181711] text-[#a8a99e]"
      >
        <option value="">-- Select contact --</option>
        {contacts.map(c => <option key={c.id} value={c.phone}>{c.name} ({c.phone})</option>)}
      </select>
      <button onClick={onAddContact} className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300">
        <Plus className="w-3 h-3" /> Add test contact
      </button>
    </div>
  );
}
