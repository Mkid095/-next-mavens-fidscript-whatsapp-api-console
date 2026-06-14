import React, { useState } from 'react';
import {
  Search, X, Users, Phone, ChevronDown, MessageSquare
} from 'lucide-react';
import type { Contact } from '../../services/api';
import { contactsApi } from '../../services/api';

interface NewChatPanelInlineProps {
  savedContacts: Contact[];
  clientToken?: string;
  onSelectContact: (phone: string) => void;
  onContactCreated: (contact: Contact) => void;
  onClose: () => void;
}

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' }, { code: '+44', country: 'UK' },
  { code: '+254', country: 'Kenya' }, { code: '+255', country: 'Tanzania' },
  { code: '+256', country: 'Uganda' }, { code: '+250', country: 'Rwanda' },
  { code: '+251', country: 'Ethiopia' }, { code: '+91', country: 'India' },
  { code: '+92', country: 'Pakistan' }, { code: '+880', country: 'Bangladesh' },
  { code: '+60', country: 'Malaysia' }, { code: '+65', country: 'Singapore' },
  { code: '+234', country: 'Nigeria' }, { code: '+233', country: 'Ghana' },
  { code: '+27', country: 'South Africa' }, { code: '+971', country: 'UAE' },
  { code: '+966', country: 'Saudi Arabia' }, { code: '+86', country: 'China' },
  { code: '+81', country: 'Japan' }, { code: '+61', country: 'Australia' },
];

export default function NewChatPanelInline({
  savedContacts, clientToken, onSelectContact, onContactCreated, onClose
}: NewChatPanelInlineProps) {
  const [tab, setTab] = useState<'contacts' | 'newnumber'>('contacts');
  const [contactSearch, setContactSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('+254');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = savedContacts.filter(c =>
    !contactSearch || c.phone.includes(contactSearch) || (c.name || '').toLowerCase().includes(contactSearch.toLowerCase())
  );

  const selectedCountryData = COUNTRY_CODES.find(c => c.code === selectedCountry);

  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setPhoneInput(selectedCountry + digits);
  };

  const handleStartChat = async () => {
    if (!phoneInput.trim()) return;
    setLoading(true);
    try {
      const phone = phoneInput.replace(/\D/g, '');
      const existing = savedContacts.find(c => c.phone === phone);
      if (existing) {
        onSelectContact(phone);
      } else {
        const res = await contactsApi.importBatch([{ phone, name: nameInput.trim() }]);
        if (res.success) {
          const newContact: Contact = { id: `new_${Date.now()}`, phone, name: nameInput.trim() || phone, tags: '', created_at: new Date().toISOString() };
          onContactCreated(newContact);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex border-b border-[#eaebe4] shrink-0 items-center">
        <button
          onClick={() => setTab('contacts')}
          className={`flex-1 py-2.5 text-[11px] font-bold transition-all border-b-2 ${tab === 'contacts' ? 'border-forest-deep text-forest-deep' : 'border-transparent text-stone-400'}`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Existing
          </div>
        </button>
        <button
          onClick={() => setTab('newnumber')}
          className={`flex-1 py-2.5 text-[11px] font-bold transition-all border-b-2 ${tab === 'newnumber' ? 'border-forest-deep text-forest-deep' : 'border-transparent text-stone-400'}`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            New Number
          </div>
        </button>
        <button onClick={onClose} className="px-3 py-2 text-stone-400 hover:text-stone-600 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === 'contacts' && (
          savedContacts.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Users className="w-8 h-8 mx-auto text-stone-200" />
              <p className="text-xs font-bold text-forest-deep">No saved contacts</p>
              <p className="text-[10px] text-graphite">Switch to "New Number" to message anyone</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white"
                />
              </div>
              <div className="space-y-1">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onSelectContact(c.phone)}
                    className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-stone-50 flex items-center gap-3 transition-all border border-transparent hover:border-[#eaebe4]"
                  >
                    <div className="w-9 h-9 rounded-full bg-forest-deep flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {(c.name || c.phone).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-forest-deep truncate">{c.name || c.phone}</p>
                      <p className="text-[10px] text-stone-400 font-mono">{c.phone}</p>
                    </div>
                    {c.tags && <span className="text-[9px] px-1.5 py-0.5 bg-stone-100 rounded-full text-stone-500 shrink-0">{c.tags}</span>}
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-center text-[11px] text-stone-400 py-4">No contacts match your search</p>}
              </div>
            </>
          )
        )}

        {tab === 'newnumber' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Country</label>
              <div className="relative mt-1">
                <button
                  onClick={() => setShowCountryPicker(!showCountryPicker)}
                  className="w-full px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white flex items-center justify-between"
                >
                  <span className="font-bold text-forest-deep">{selectedCountryData?.code} {selectedCountryData?.country}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>
                {showCountryPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#eaebe4] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {COUNTRY_CODES.map(c => (
                      <button
                        key={c.code}
                        onClick={() => { setSelectedCountry(c.code); setShowCountryPicker(false); setPhoneInput(''); }}
                        className={`w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 ${selectedCountry === c.code ? 'bg-yellow-50 font-bold text-forest-deep' : 'text-stone-600'}`}
                      >
                        <span className="font-mono text-[10px] text-stone-400 w-10">{c.code}</span>
                        <span>{c.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Phone Number</label>
              <div className="mt-1 flex rounded-xl border border-[#eaebe4] overflow-hidden focus-within:border-yellow-500">
                <div className="px-3 py-2 bg-stone-50 text-xs font-bold text-stone-500 font-mono flex items-center border-r border-[#eaebe4] shrink-0">
                  {selectedCountry}
                </div>
                <input
                  type="tel"
                  value={phoneInput.replace(selectedCountry, '')}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="712 345 678"
                  className="flex-1 px-3 py-2 text-xs font-mono focus:outline-none bg-white"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Name (optional)</label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Display name for this contact"
                className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
              />
            </div>

            {phoneInput && (
              <div className="px-3 py-2 bg-stone-50 rounded-xl flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs font-mono text-forest-deep">{phoneInput}</span>
              </div>
            )}

            <button
              onClick={handleStartChat}
              disabled={!phoneInput.trim() || loading}
              className="w-full py-2.5 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {loading ? 'Starting...' : 'Open Chat'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
