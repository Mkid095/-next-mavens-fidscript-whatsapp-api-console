import { Search, X, Plus, Zap, AlertCircle, SendHorizontal, Calendar, Users, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Instance, Contact, ContactGroup } from '../../../services/api';

export interface CreatePanelProps {
  campaignName: string;
  onCampaignNameChange: (v: string) => void;
  selectedInstance: string;
  onInstanceChange: (v: string) => void;
  instances: Instance[];
  messageText: string;
  onMessageChange: (v: string) => void;
  selectedContacts: Set<string>;
  onToggleContact: (phone: string) => void;
  savedContacts: Contact[];
  phoneInput: string;
  onPhoneInputChange: (v: string) => void;
  extraPhones: string[];
  onAddPhone: () => void;
  onRemovePhone: (p: string) => void;
  scheduledAt: string;
  onScheduledChange: (v: string) => void;
  groups: ContactGroup[];
  selectedGroup: string;
  onGroupChange: (v: string) => void;
  recipientCount: number;
  totalCost: number;
  creating: boolean;
  error: string;
  onCreate: () => void;
}

export default function CreatePanel({
  campaignName, onCampaignNameChange,
  selectedInstance, onInstanceChange, instances,
  messageText, onMessageChange,
  selectedContacts, onToggleContact, savedContacts,
  phoneInput, onPhoneInputChange, extraPhones, onAddPhone, onRemovePhone,
  scheduledAt, onScheduledChange,
  groups, selectedGroup, onGroupChange,
  recipientCount, totalCost, creating, error, onCreate,
}: CreatePanelProps) {
  const [contactSearch, setContactSearch] = useState('');
  const [showAllContacts, setShowAllContacts] = useState(false);

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return savedContacts;
    const q = contactSearch.toLowerCase();
    return savedContacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(contactSearch)
    );
  }, [savedContacts, contactSearch]);

  const DISPLAY_LIMIT = 20;
  const displayedContacts = showAllContacts ? filteredContacts : filteredContacts.slice(0, DISPLAY_LIMIT);
  const hasMoreContacts = filteredContacts.length > DISPLAY_LIMIT;

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {/* Campaign name + instance */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] font-bold text-graphite uppercase mb-1">Campaign name</label>
          <input
            type="text" value={campaignName} onChange={e => onCampaignNameChange(e.target.value)}
            placeholder="e.g. Black Friday promo"
            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-graphite uppercase mb-1">Send from</label>
          <select
            value={selectedInstance} onChange={e => onInstanceChange(e.target.value)}
            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs focus:outline-none focus:border-yellow-500"
          >
            <option value="">Select instance</option>
            {instances.map(i => (
              <option key={i.id} value={i.name}>
                {i.display_name || i.name} {i.phone_number ? `· ${i.phone_number}` : ''} [{i.status}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Group selector */}
      <div>
        <label className="block text-[9px] font-bold text-graphite uppercase mb-1 flex items-center gap-1">
          <Users className="w-3 h-3" /> Send to group (overrides contacts below)
        </label>
        <select
          value={selectedGroup} onChange={e => onGroupChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs focus:outline-none focus:border-yellow-500"
        >
          <option value="">— No group —</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.member_count} members)</option>
          ))}
        </select>
      </div>

      {/* Contact picker + extra phones */}
      {!selectedGroup && (
        <div className="space-y-2">
          <label className="block text-[9px] font-bold text-graphite uppercase mb-1">Recipients</label>

          {/* Selected contact chips */}
          {selectedContacts.size > 0 && (
            <div className="flex flex-wrap gap-1 min-h-[24px]">
              {Array.from(selectedContacts).map(phone => {
                const contact = savedContacts.find(c => c.phone === phone);
                return (
                  <span key={phone} className="inline-flex items-center gap-1 px-2 py-0.5 bg-forest-deep text-white text-[10px] rounded-full">
                    <span className="max-w-[100px] truncate">{contact?.name || phone}</span>
                    <button
                      onClick={() => onToggleContact(phone)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Working search input */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-stone-50 border border-[#eaebe4] rounded-xl">
            <Search className="w-3 h-3 text-stone-400 shrink-0" />
            <input
              type="text"
              value={contactSearch}
              onChange={e => { setContactSearch(e.target.value); setShowAllContacts(false); }}
              placeholder="Search contacts…"
              className="flex-1 bg-transparent text-[10px] outline-none placeholder:text-stone-400"
            />
            {contactSearch && (
              <button onClick={() => setContactSearch('')} className="text-stone-400 hover:text-stone-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Contact count badge */}
          {filteredContacts.length > 0 && (
            <p className="text-[9px] text-stone-400">
              {filteredContacts.length} contact{filteredContacts.length === 1 ? '' : 's'} found
              {contactSearch && ` matching "${contactSearch}"`}
            </p>
          )}

          {savedContacts.length > 0 ? (
            <>
              <div className="max-h-40 overflow-y-auto border border-[#eaebe4] rounded-xl divide-y divide-[#eaebe4]/50">
                {displayedContacts.map(c => (
                  <label key={c.id} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-50 cursor-pointer text-[10px]">
                    <input
                      type="checkbox" checked={selectedContacts.has(c.phone)}
                      onChange={() => onToggleContact(c.phone)}
                      className="rounded"
                    />
                    <span className="flex-1 truncate text-stone-700">{c.name}</span>
                    <span className="font-mono text-stone-500">{c.phone}</span>
                  </label>
                ))}
              </div>
              {hasMoreContacts && !showAllContacts && (
                <button
                  onClick={() => setShowAllContacts(true)}
                  className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-forest-deep hover:bg-stone-50 rounded-lg font-medium transition-colors"
                >
                  Show {filteredContacts.length - DISPLAY_LIMIT} more <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </>
          ) : (
            <p className="text-[10px] text-stone-500 italic">No saved contacts. Add phone numbers below.</p>
          )}
          <div className="flex items-center gap-1.5">
            <input
              type="tel" value={phoneInput} onChange={e => onPhoneInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onAddPhone()}
              placeholder="+254712345678"
              className="flex-1 px-3 py-1.5 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
            />
            <button onClick={onAddPhone} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-[10px] font-bold text-stone-600 transition-all">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          {extraPhones.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {extraPhones.map(p => (
                <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-700 text-[10px] font-mono rounded-full">
                  {p}
                  <button onClick={() => onRemovePhone(p)}><X className="w-2.5 h-2.5 text-stone-400" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message body */}
      <div>
        <label className="block text-[9px] font-bold text-graphite uppercase mb-1">Message</label>
        <textarea
          value={messageText} onChange={e => onMessageChange(e.target.value)} rows={4}
          placeholder="Type your message. {{name}} is replaced per recipient."
          className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs focus:outline-none focus:border-yellow-500"
        />
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[10px] text-stone-400">
            {messageText.length} chars
            {messageText.length > 1600 ? ' (3 SMS segments)' : messageText.length > 400 ? ' (2 SMS segments)' : ''}
          </p>
          <p className="text-[10px] text-stone-400">
            ≈ {messageText.length > 1600 ? 3 : messageText.length > 400 ? 2 : 1} token/recipient
          </p>
        </div>
      </div>

      {/* Schedule */}
      <div>
        <label className="block text-[9px] font-bold text-graphite uppercase mb-1 flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Schedule (optional)
        </label>
        <input
          type="datetime-local" value={scheduledAt} onChange={e => onScheduledChange(e.target.value)}
          min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
          className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs focus:outline-none focus:border-yellow-500"
        />
      </div>

      {error && (
        <p className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {/* Footer summary + launch */}
      <div className="sticky bottom-0 bg-white border-t border-stone-100 -mx-3 px-3 py-2.5 flex items-center gap-2">
        <div className="flex-1 text-[10px] text-stone-600">
          <p><span className="font-bold text-forest-deep">{recipientCount}</span> recipient{recipientCount === 1 ? '' : 's'}</p>
          <p>
            <span className="font-bold text-forest-deep">{totalCost}</span> token{totalCost === 1 ? '' : 's'}
            {recipientCount > 0 && <span className="text-stone-400"> (~{(messageText.length > 1600 ? 3 : messageText.length > 400 ? 2 : 1)}×{recipientCount})</span>}
          </p>
        </div>
        {/* Instance status indicator */}
        {selectedInstance && (
          <div className="flex items-center gap-1.5 text-[10px]">
            {(() => {
              const inst = instances.find(i => i.name === selectedInstance);
              const statusColor = inst?.status === 'connected' ? 'bg-green-500' : inst?.status === 'connecting' ? 'bg-yellow-500' : 'bg-stone-300';
              return <><span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} /><span className="text-stone-500">{inst?.display_name || selectedInstance}</span></>;
            })()}
          </div>
        )}
        <button
          onClick={onCreate}
          disabled={!campaignName.trim() || !selectedInstance || recipientCount === 0 || !messageText.trim() || creating}
          className="flex items-center gap-1.5 px-4 py-2 bg-forest-deep text-white text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-[#33301a] transition-all"
        >
          <SendHorizontal className="w-3.5 h-3.5" />
          {creating ? 'Sending…' : scheduledAt ? 'Schedule' : <><Zap className="w-3.5 h-3.5" /> Send Now</>}
        </button>
      </div>
    </div>
  );
}
