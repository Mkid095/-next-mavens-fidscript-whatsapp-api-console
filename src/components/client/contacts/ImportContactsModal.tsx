import React, { useState, useRef, useMemo } from 'react';
import { X, Download, ChevronDown, Globe, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { contactsApi } from '../../../services/api';

interface ImportContactsModalProps {
  onClose: () => void;
  onContactsImported: (newContacts: { id: string; phone: string; name: string; created_at: string }[]) => void;
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
  { code: '+60', country: 'Malaysia' },
  { code: '+65', country: 'Singapore' },
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
  { code: '+86', country: 'China' },
  { code: '+81', country: 'Japan' },
  { code: '+61', country: 'Australia' },
];

// Normalize a local number to international format given country code
function normalizeNumber(raw: string, countryCode: string): string {
  const digits = raw.replace(/\D/g, '');
  // Already has a country code prefix
  if (COUNTRY_OPTIONS.some(c => digits.startsWith(c.code.replace('+', '')))) {
    return '+' + digits;
  }
  // Starts with 00 — replace with +
  if (digits.startsWith('00')) {
    return '+' + digits.slice(2);
  }
  // Starts with 0 — strip leading 0 and prepend country code
  if (digits.startsWith('0')) {
    return countryCode + digits.slice(1);
  }
  // Bare local number — just prepend country code
  return countryCode + digits;
}

// Try to detect country from header row or content sample
function detectCountry(text: string): string {
  const upper = text.toLowerCase();
  if (upper.includes('kenya')) return '+254';
  if (upper.includes('tanzania')) return '+255';
  if (upper.includes('uganda')) return '+256';
  if (upper.includes('rwanda')) return '+250';
  if (upper.includes('ethiopia')) return '+251';
  if (upper.includes('sudan')) return '+249';
  if (upper.includes('egypt')) return '+20';
  if (upper.includes('nigeria')) return '+234';
  if (upper.includes('ghana')) return '+233';
  if (upper.includes('south africa')) return '+27';
  if (upper.includes('india')) return '+91';
  if (upper.includes('pakistan')) return '+92';
  if (upper.includes('kenyan')) return '+254';
  return '';
}

export default function ImportContactsModal({ onClose, onContactsImported }: ImportContactsModalProps) {
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('+254');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState('');
  const [preview, setPreview] = useState<{ phone: string; name: string; normalized: string }[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Always-read ref to avoid stale state in callbacks
  const countryRef = useRef(selectedCountry);
  countryRef.current = selectedCountry;

  const selectedCountryData = COUNTRY_OPTIONS.find(c => c.code === selectedCountry);

  const parseAndPreview = (text: string, countryCode: string) => {
    if (!text || !text.trim()) { setPreview([]); return; }

    // Split on newlines, keep all non-empty lines
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) { setPreview([]); return; }

    // Detect if first line is a header (has text in name column but no digits in phone column)
    const firstLine = lines[0];
    const firstParts = firstLine.split(/[,\t;]/);
    const firstPhoneRaw = firstParts[0]?.replace(/\D/g, '') || '';
    const firstHasLetters = /[a-zA-Z]/.test(firstLine);
    // Header if: has letters AND phone part has fewer than 7 digits (i.e., it's a label, not a number)
    const firstIsHeader = firstHasLetters && firstPhoneRaw.length < 7;
    const dataLines = firstIsHeader ? lines.slice(1) : lines;

    const parsed: { phone: string; name: string; normalized: string }[] = [];
    dataLines.forEach((line, i) => {
      const parts = line.split(/[,\t;]/);
      const raw = (parts[0] || '').trim();
      const name = (parts[1] || '').trim();
      const digitsOnly = raw.replace(/\D/g, '');
      if (digitsOnly.length < 7) return; // skip too-short numbers
      parsed.push({
        phone: raw,
        name: name || `Contact ${i + 1}`,
        normalized: normalizeNumber(raw, countryCode),
      });
    });

    setPreview(parsed);
  };

  const handleTextChange = (text: string) => {
    setImportText(text);
    setError('');
    if (!text.trim()) { setPreview([]); return; }

    // Auto-detect country from content on first change
    if (!detectedCountry) {
      const detected = detectCountry(text);
      if (detected) {
        setDetectedCountry(detected);
        setSelectedCountry(detected);
        parseAndPreview(text, detected);
        return;
      }
    }
    // Always use the ref so we never use stale state
    parseAndPreview(text, countryRef.current);
  };

  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    setDetectedCountry(code);
    setShowCountryPicker(false);
    if (importText.trim()) parseAndPreview(importText, code);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const countryFromFile = detectCountry(text);
    const country = countryFromFile || countryRef.current;
    if (countryFromFile) {
      setDetectedCountry(countryFromFile);
      setSelectedCountry(countryFromFile);
    }
    setImportText(text);
    parseAndPreview(text, country);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    setError('');
    try {
      const contacts = preview.map(p => ({ phone: p.normalized, name: p.name }));
      const res = await contactsApi.importBatch(contacts);
      if (res.success) {
        const newContacts = contacts.map((c, i) => ({
          id: `contact-${Date.now()}-${i}`,
          phone: c.phone,
          name: c.name,
          created_at: new Date().toISOString(),
        }));
        onContactsImported(newContacts);
        onClose();
      } else {
        setError(res.error || 'Import failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const cc = selectedCountry; // always current — no stale closure
    const example1 = cc + '712345678';
    const example2 = cc + '701234567';
    const example3 = cc + '800000001';
    const example4 = cc + '900000002';
    const csv = `phone,name\n${example1},John Doe\n${example2},Mary Wanjiku\n${example3},Sam Otieno\n${example4},Jane Smith`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Globe className="w-4 h-4 text-yellow-700" />
            </div>
            <h4 className="font-bold text-sm">Import Contacts</h4>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X className="w-4 h-4" /></button>
        </div>

        {/* Country selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Default Country</label>
          <p className="text-[9px] text-stone-400">Used to auto-prefix local numbers (e.g. 0712... becomes +254 712...)</p>
          <div className="relative">
            <button
              onClick={() => setShowCountryPicker(!showCountryPicker)}
              className="w-full px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white flex items-center justify-between"
            >
              <span className="font-bold text-forest-deep">{selectedCountryData?.code} {selectedCountryData?.country}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>
            {showCountryPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#eaebe4] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {COUNTRY_OPTIONS.map(c => (
                  <button
                    key={c.code}
                    onClick={() => handleCountryChange(c.code)}
                    className={`w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 ${selectedCountry === c.code ? 'bg-yellow-50 font-bold text-forest-deep' : 'text-stone-600'}`}
                  >
                    <span className="font-mono text-[10px] text-stone-400 w-10">{c.code}</span>
                    <span>{c.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {detectedCountry && (
            <div className="flex items-center gap-1.5 text-[9px] text-green-600 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Country detected from file: {COUNTRY_OPTIONS.find(c => c.code === detectedCountry)?.country}
            </div>
          )}
        </div>

        {/* File upload */}
        <div>
          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1 block">Upload CSV or TXT</label>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="w-full text-xs border border-[#eaebe4] rounded-xl p-2" />
          <button onClick={downloadTemplate} className="mt-2 w-full flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-600 py-2 rounded-xl text-[11px] font-bold border border-stone-200 transition-all">
            <Download className="w-3 h-3" /> Download Template
          </button>
        </div>

        <div className="text-center text-[9px] text-stone-400 font-semibold">OR paste numbers below</div>

        {/* Text area */}
        <div>
          <textarea
            rows={5}
            value={importText}
            onChange={e => handleTextChange(e.target.value)}
            placeholder={"254712345678, John Doe\n0712345678, Mary Wanjiku\n255612345678, Juma Ally"}
            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 text-[11px] font-mono resize-none"
          />
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                Preview ({preview.length} contacts)
              </span>
              <span className="text-[9px] text-stone-400">
                Prefixed with {selectedCountry}
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto border border-[#eaebe4] rounded-xl divide-y divide-[#eaebe4]/50">
              {preview.slice(0, 20).map((p, i) => (
                <div key={i} className="px-3 py-1.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-forest-deep">{p.name}</p>
                    <p className="text-[9px] text-stone-400 font-mono">{p.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono font-bold text-green-700">{p.normalized}</p>
                  </div>
                </div>
              ))}
              {preview.length > 20 && (
                <div className="px-3 py-1.5 text-[10px] text-stone-400 text-center">
                  +{preview.length - 20} more
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl text-[11px] text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={preview.length === 0 || importing}
          className="w-full bg-forest-deep hover:bg-[#33301a] text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-40 transition-all"
        >
          {importing ? 'Importing...' : `Import ${preview.length} Contacts`}
        </button>
      </motion.div>
    </div>
  );
}
