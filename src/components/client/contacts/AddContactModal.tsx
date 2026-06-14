import React, { useState } from 'react';
import { X, ChevronDown, Phone, User, Tag, Save } from 'lucide-react';
import { contactsApi } from '../../../services/api';

interface AddContactModalProps {
  onClose: () => void;
  onSaved: (contact: { id: string; phone: string; name: string; created_at: string }) => void;
  existingPhones?: Set<string>;
}

const COUNTRY_OPTIONS = [
  { code: '+254', country: 'Kenya' },
  { code: '+255', country: 'Tanzania' },
  { code: '+256', country: 'Uganda' },
  { code: '+250', country: 'Rwanda' },
  { code: '+251', country: 'Ethiopia' },
  { code: '+249', country: 'Sudan' },
  { code: '+20', country: 'Egypt' },
  { code: '+216', country: 'Tunisia' },
  { code: '+213', country: 'Algeria' },
  { code: '+212', country: 'Morocco' },
  { code: '+91', country: 'India' },
  { code: '+92', country: 'Pakistan' },
  { code: '+880', country: 'Bangladesh' },
  { code: '+234', country: 'Nigeria' },
  { code: '+233', country: 'Ghana' },
  { code: '+27', country: 'South Africa' },
  { code: '+1', country: 'US / Canada' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+34', country: 'Spain' },
  { code: '+39', country: 'Italy' },
  { code: '+971', country: 'UAE' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+65', country: 'Singapore' },
  { code: '+60', country: 'Malaysia' },
];

export default function AddContactModal({ onClose, onSaved, existingPhones }: AddContactModalProps) {
  const [name, setName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('+254');
  const [phoneInput, setPhoneInput] = useState('');
  const [tags, setTags] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedCountryData = COUNTRY_OPTIONS.find(c => c.code === selectedCountry);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = phoneInput.replace(/\D/g, '');
    if (!phoneDigits) {
      setError('Phone number is required');
      return;
    }
    const fullPhone = selectedCountry + phoneDigits;
    const normalized = phoneDigits;
    if (existingPhones?.has(normalized) || existingPhones?.has(fullPhone)) {
      setError('This phone number is already in your contacts.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await contactsApi.importBatch([{ phone: fullPhone, name: name.trim(), tags: tags.trim() }]);
      if (res.success) {
        onSaved({
          id: `new_${Date.now()}`,
          phone: fullPhone,
          name: name.trim() || fullPhone,
          created_at: new Date().toISOString(),
        });
        onClose();
      } else {
        setError(res.error || 'Failed to save contact');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-96 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#eaebe4] flex items-center justify-between bg-[#fafaf5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-deep flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-forest-deep">Add Contact</h3>
              <p className="text-[10px] text-graphite">Add a single contact to your list</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Wanjiku"
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Country + Phone */}
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Phone Number</label>
            <div className="mt-1 flex rounded-xl border border-[#eaebe4] overflow-hidden focus-within:border-yellow-500">
              {/* Country picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountryPicker(!showCountryPicker)}
                  className="h-full px-3 py-2 bg-stone-50 border-r border-[#eaebe4] flex items-center gap-1.5 text-[11px] font-bold text-forest-deep hover:bg-stone-100 transition-all"
                >
                  {selectedCountry}
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>
                {showCountryPicker && (
                  <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-[#eaebe4] rounded-xl shadow-lg z-10 max-h-56 overflow-y-auto">
                    {COUNTRY_OPTIONS.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setSelectedCountry(c.code); setShowCountryPicker(false); }}
                        className={`w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 ${selectedCountry === c.code ? 'bg-yellow-50 font-bold text-forest-deep' : 'text-stone-600'}`}
                      >
                        <span className="font-mono text-[10px] text-stone-400 w-10">{c.code}</span>
                        <span>{c.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Phone input */}
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="712 345 678"
                className="flex-1 px-3 py-2 text-xs font-mono focus:outline-none bg-white"
                autoFocus
              />
            </div>
            {phoneInput && (
              <p className="text-[9px] text-stone-400 mt-1">
                Full: <span className="font-mono font-bold text-forest-deep">{selectedCountry} {phoneInput}</span>
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Tags <span className="normal-case font-normal text-stone-400">(optional)</span></label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="vip, lead, customer"
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
            />
            <p className="text-[9px] text-stone-400 mt-1">Separate multiple tags with commas</p>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 rounded-xl text-[11px] text-red-600">{error}</div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-bold text-stone-500 hover:text-stone-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !phoneInput.trim()}
              className="flex-1 py-2 bg-forest-deep hover:bg-[#33301a] text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
