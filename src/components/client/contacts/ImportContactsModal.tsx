import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Download, ChevronDown, Globe, AlertCircle, RefreshCw, Unlink, CheckCircle2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { contactsApi, openGoogleOAuthPopup } from '../../../services/contacts';

interface ImportContactsModalProps {
  onClose: () => void;
  onContactsImported: (newContacts: { id: string; phone: string; name: string; created_at: string }[]) => void;
  existingPhones?: Set<string>;
}

interface ParsedRow {
  phone: string;
  name: string;
  normalized: string;
  isDuplicate: boolean;
  isInvalid: boolean;
  invalidReason?: string;
}

interface ImportResult {
  imported: number;
  errors: number;
  total: number;
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

function normalizeNumber(raw: string, countryCode: string): string {
  const digits = raw.replace(/\D/g, '');
  if (COUNTRY_OPTIONS.some(c => digits.startsWith(c.code.replace('+', '')))) {
    return '+' + digits;
  }
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  if (digits.startsWith('0')) return countryCode + digits.slice(1);
  return countryCode + digits;
}

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

type DuplicateMode = 'skip' | 'update';

export default function ImportContactsModal({ onClose, onContactsImported, existingPhones }: ImportContactsModalProps) {
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('+254');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState('');
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>('skip');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef(selectedCountry);
  countryRef.current = selectedCountry;

  // Google OAuth state
  const [googleStatus, setGoogleStatus] = useState<{
    linked: boolean;
    name?: string;
    email?: string;
    picture?: string;
  } | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Google result state (after sync)
  const [googleResult, setGoogleResult] = useState<ImportResult | null>(null);

  // Check Google link status on mount
  useEffect(() => {
    contactsApi.googleStatus().then(res => {
      console.debug('[GoogleContacts] status response:', res);
      if (res.success) setGoogleStatus(res.data ?? { linked: false });
      else console.warn('[GoogleContacts] status failed:', res.error, res.status);
    }).catch(err => console.error('[GoogleContacts] status exception:', err));
  }, []);

  // Check URL for OAuth result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_linked') === '1') {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      contactsApi.googleStatus().then(res => {
        if (res.success) setGoogleStatus(res.data ?? { linked: false });
      });
    }
    const googleErr = params.get('google_error');
    if (googleErr) {
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      setGoogleError(decodeURIComponent(googleErr));
      setTimeout(() => setGoogleError(''), 5000);
    }
  }, []);

  const selectedCountryData = COUNTRY_OPTIONS.find(c => c.code === selectedCountry);

  const parseAndPreview = useCallback((text: string, countryCode: string, existing?: Set<string>) => {
    if (!text || !text.trim()) { setPreview([]); return; }

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) { setPreview([]); return; }

    const firstLine = lines[0];
    const firstParts = firstLine.split(/[,\t;]/);
    const firstPhoneRaw = firstParts[0]?.replace(/\D/g, '') || '';
    const firstHasLetters = /[a-zA-Z]/.test(firstLine);
    const firstIsHeader = firstHasLetters && firstPhoneRaw.length < 7;
    const dataLines = firstIsHeader ? lines.slice(1) : lines;

    const seenNumbers = new Set<string>();
    const parsed: ParsedRow[] = [];

    dataLines.forEach((line, i) => {
      const parts = line.split(/[,\t;]/);
      const raw = (parts[0] || '').trim();
      const name = (parts[1] || '').trim();
      const digitsOnly = raw.replace(/\D/g, '');

      if (digitsOnly.length < 7) {
        parsed.push({ phone: raw, name: name || `Row ${i + 1}`, normalized: '', isDuplicate: false, isInvalid: true, invalidReason: 'Phone number too short' });
        return;
      }
      if (!/^\+?\d{7,15}$/.test('+' + digitsOnly)) {
        parsed.push({ phone: raw, name: name || `Row ${i + 1}`, normalized: '', isDuplicate: false, isInvalid: true, invalidReason: 'Invalid phone format' });
        return;
      }

      const normalized = normalizeNumber(raw, countryCode);
      const normalizedDigits = normalized.replace(/^\+/, '');
      const isDuplicate = seenNumbers.has(normalizedDigits) || (existing?.has(normalizedDigits) ?? false);
      seenNumbers.add(normalizedDigits);
      parsed.push({ phone: raw, name: name || `Contact ${i + 1}`, normalized, isDuplicate, isInvalid: false });
    });

    setPreview(parsed);
  }, []);

  const handleTextChange = (text: string) => {
    setImportText(text);
    setError('');
    setSuccessMsg('');
    setGoogleResult(null);
    if (!text.trim()) { setPreview([]); return; }
    if (!detectedCountry) {
      const detected = detectCountry(text);
      if (detected) {
        setDetectedCountry(detected);
        setSelectedCountry(detected);
        parseAndPreview(text, detected, existingPhones);
        return;
      }
    }
    parseAndPreview(text, countryRef.current, existingPhones);
  };

  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    setDetectedCountry(code);
    setShowCountryPicker(false);
    if (importText.trim()) parseAndPreview(importText, code, existingPhones);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const countryFromFile = detectCountry(text);
    const country = countryFromFile || countryRef.current;
    if (countryFromFile) { setDetectedCountry(countryFromFile); setSelectedCountry(countryFromFile); }
    setImportText(text);
    parseAndPreview(text, country, existingPhones);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    const toImport = preview.filter(p => !p.isInvalid && !p.isDuplicate);
    if (toImport.length === 0) { setError('No valid contacts to import'); return; }

    const BATCH_SIZE = 50;
    setImporting(true);
    setError('');
    setSuccessMsg('');
    setGoogleResult(null);
    setImportProgress(0);
    try {
      const allContacts = toImport.map(p => ({ phone: p.normalized, name: p.name }));
      const batches: typeof allContacts[] = [];
      for (let i = 0; i < allContacts.length; i += BATCH_SIZE) batches.push(allContacts.slice(i, i + BATCH_SIZE));

      let totalImported = 0;
      for (let i = 0; i < batches.length; i++) {
        const res = await contactsApi.importBatch(batches[i]);
        if (!res.success) {
          setError(res.error || `Import failed on batch ${i + 1}`);
          setImporting(false);
          return;
        }
        totalImported += batches[i].length;
        setImportProgress(Math.round((totalImported / allContacts.length) * 100));
      }

      const newContacts = allContacts.map((c, i) => ({
        id: `contact-${Date.now()}-${i}`,
        phone: c.phone,
        name: c.name,
        created_at: new Date().toISOString(),
      }));
      setSuccessMsg(`Successfully imported ${totalImported} contact${totalImported !== 1 ? 's' : ''}`);
      onContactsImported(newContacts);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const cc = selectedCountry;
    const csv = `phone,name\n${cc}712345678,John Doe\n${cc}701234567,Mary Wanjiku\n${cc}800000001,Sam Otieno`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "contacts_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Google OAuth handlers ───────────────────────────────────────────────────

  const handleLinkGoogle = async () => {
    setGoogleError('');
    setGoogleLoading(true);
    try {
      await openGoogleOAuthPopup();
      const res = await contactsApi.googleStatus();
      if (res.success) setGoogleStatus(res.data ?? { linked: false });
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : 'Failed to link Google account');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    try {
      await contactsApi.googleUnlink();
      setGoogleStatus({ linked: false });
      setGoogleResult(null);
    } catch {}
  };

  const handleGoogleSync = async () => {
    setGoogleError('');
    setGoogleSyncing(true);
    setSuccessMsg('');
    setGoogleResult(null);
    try {
      const res = await contactsApi.googleImport();
      if (res.success && res.data) {
        setGoogleResult(res.data);
        setSuccessMsg(`Google sync complete: ${res.data.imported} imported, ${res.data.errors} errors`);
        // Refresh contacts list
        const allContacts = await contactsApi.getAll();
        if (allContacts.success && allContacts.data) {
          onContactsImported(allContacts.data.map(c => ({ id: c.id, phone: c.phone, name: c.name, created_at: c.created_at })));
        }
      } else {
        setGoogleError(res.error || 'Sync failed');
      }
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setGoogleSyncing(false);
    }
  };

  const validCount = preview.filter(p => !p.isInvalid && !p.isDuplicate).length;
  const invalidCount = preview.filter(p => p.isInvalid).length;
  const duplicateCount = preview.filter(p => p.isDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#2d2813]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2d2813] flex items-center justify-center">
              <Globe className="w-4 h-4 text-[#eab308]" />
            </div>
            <h4 className="font-bold text-sm text-[#a8a99e]">Import Contacts</h4>
          </div>
          <button onClick={onClose} className="text-[#6e684a] hover:text-[#a8a99e]"><X className="w-4 h-4" /></button>
        </div>

        {/* ─── Google OAuth Section ─────────────────────────────────────────── */}
        <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            {/* Google "G" icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M44 24.5c0-1.4-.1-2.7-.4-4H24v7.6h11.3c-.5 2.7-2 5-4.2 6.5v5.4h6.8c4-3.7 6.3-9.2 6.3-15.5z"/>
              <path fill="#34A853" d="M24 46c5.9 0 10.8-1.9 14.4-5.2l-6.8-5.4c-1.9 1.3-4.4 2.1-7.6 2.1-5.8 0-10.8-3.9-12.6-9.2H4.4v5.6C7.2 41.8 15.2 46 24 46z"/>
              <path fill="#FBBC05" d="M11.4 28.6C11.1 28 10.9 27.3 10.9 26.5s.2-1.5.5-2.1V18.8H4.4C3.3 20.9 2.6 23.2 2.6 25.5s.7 4.6 1.8 6.3l7-.2z"/>
              <path fill="#EA4335" d="M24 12.2c3.2 0 6 1.1 8.2 3.3l6.1-6.1C34.7 5.1 29.8 3 24 3 15.2 3 7.2 7.2 4.4 12.8l6.9 5.4c1.8-5.3 6.8-9.2 12.7-9.2z"/>
            </svg>
            <div>
              <p className="text-xs font-bold text-[#a8a99e]">Google Contacts</p>
              <p className="text-[10px] text-[#6e684a]">Sync names from your Google address book</p>
            </div>
          </div>

          {googleError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 rounded-xl text-[11px] text-red-400 border border-red-900/50">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {googleError}
            </div>
          )}

          {successMsg && !googleError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 rounded-xl text-[11px] text-green-400 border border-green-900/50">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {successMsg}
            </div>
          )}

          {!googleStatus ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#6e684a] border-t-[#eab308] rounded-full animate-spin" />
              <span className="text-[10px] text-[#6e684a]">Checking Google link status…</span>
            </div>
          ) : googleStatus.linked ? (
            <div className="flex items-center gap-3">
              {googleStatus.picture ? (
                <img src={googleStatus.picture} alt="" className="w-9 h-9 rounded-full border-2 border-[#2d2813]" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#2d2813] flex items-center justify-center text-[#eab308] text-xs font-bold border-2 border-[#3d3a1e]">
                  {(googleStatus.name || googleStatus.email || 'G')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#a8a99e] truncate">{googleStatus.name || 'Google Account'}</p>
                <p className="text-[10px] text-[#6e684a] truncate">{googleStatus.email}</p>
              </div>
              <button
                onClick={handleGoogleSync}
                disabled={googleSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eab308] text-[#181711] text-[10px] font-bold rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${googleSyncing ? 'animate-spin' : ''}`} />
                {googleSyncing ? 'Syncing…' : 'Sync Now'}
              </button>
              <button
                onClick={handleUnlinkGoogle}
                className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-[#6e684a] hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20"
                title="Unlink Google"
              >
                <Unlink className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLinkGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60"
            >
              {googleLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#fff" d="M24 9.5c3.5 0 6.4 1.2 8.3 3.6L38.4 7.6C35.6 4.2 30.2 2 24 2 15.2 2 7.2 6.2 4.4 11.8L10.4 17C12.6 11.3 18 9.5 24 9.5z"/><path fill="#4285F4" d="M44 24.5c0-1.4-.1-2.7-.4-4H24v7.6h11.3c-.5 2.7-2 5-4.2 6.5v5.4h6.8c4-3.7 6.3-9.2 6.3-15.5z"/><path fill="#34A853" d="M24 46c5.9 0 10.8-1.9 14.4-5.2l-6.8-5.4c-1.9 1.3-4.4 2.1-7.6 2.1-5.8 0-10.8-3.9-12.6-9.2H4.4v5.6C7.2 41.8 15.2 46 24 46z"/><path fill="#FBBC05" d="M11.4 28.6C11.1 28 10.9 27.3 10.9 26.5s.2-1.5.5-2.1V18.8H4.4C3.3 20.9 2.6 23.2 2.6 25.5s.7 4.6 1.8 6.3l7-.2z"/><path fill="#EA4335" d="M24 12.2c3.2 0 6 1.1 8.2 3.3l6.1-6.1C34.7 5.1 29.8 3 24 3 15.2 3 7.2 7.2 4.4 12.8l6.9 5.4c1.8-5.3 6.8-9.2 12.7-9.2z"/></svg>
                  Link Google Account
                </>
              )}
            </button>
          )}
        </div>

        {/* ─── Divider ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#2d2813]" />
          <span className="text-[9px] text-[#6e684a] font-semibold uppercase tracking-widest">or import from file</span>
          <div className="flex-1 h-px bg-[#2d2813]" />
        </div>

        {/* Country selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#6e684a] uppercase tracking-wide">Default Country</label>
          <p className="text-[9px] text-[#5a554a]">Auto-prefixes local numbers (e.g. 0712… → +254 712…)</p>
          <div className="relative">
            <button
              onClick={() => setShowCountryPicker(!showCountryPicker)}
              className="w-full px-3 py-2 text-xs border border-[#2d2813] rounded-xl focus:outline-none focus:border-[#eab308] bg-[#181711] text-[#a8a99e] flex items-center justify-between hover:bg-[#2d2813] transition-all"
            >
              <span className="font-bold">{selectedCountryData?.code} {selectedCountryData?.country}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6e684a]" />
            </button>
            {showCountryPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1915] border border-[#2d2813] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {COUNTRY_OPTIONS.map(c => (
                  <button
                    key={c.code}
                    onClick={() => handleCountryChange(c.code)}
                    className={`w-full px-3 py-2 text-left text-[11px] hover:bg-[#3d3a1e] flex items-center gap-2 ${selectedCountry === c.code ? 'bg-[#eab308]/10 font-bold text-[#eab308]' : 'text-[#6e684a]'}`}
                  >
                    <span className="font-mono text-[10px] text-[#6e684a] w-10">{c.code}</span>
                    <span>{c.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {detectedCountry && (
            <div className="flex items-center gap-1.5 text-[9px] text-green-400 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Country detected from file: {COUNTRY_OPTIONS.find(c => c.code === detectedCountry)?.country}
            </div>
          )}
        </div>

        {/* File upload */}
        <div>
          <label className="text-[10px] font-bold text-[#6e684a] uppercase tracking-wide mb-1 block">Upload CSV or TXT</label>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="w-full text-xs border border-[#2d2813] rounded-xl p-2 bg-[#181711] text-[#6e684a] file:mr-3 file:text-[10px] file:font-bold file:text-[#eab308] file:bg-[#2d2813] file:rounded-lg file:px-2 file:py-1 file:border-0 hover:file:bg-[#3d3a1e] file:transition-all cursor-pointer" />
          <button onClick={downloadTemplate} className="mt-2 w-full flex items-center justify-center gap-2 bg-[#2d2813] hover:bg-[#3d3a1e] text-[#6e684a] py-2 rounded-xl text-[11px] font-bold border border-[#3d3a1e] transition-all">
            <Download className="w-3 h-3" /> Download Template
          </button>
        </div>

        <div className="text-center text-[9px] text-[#5a554a] font-semibold">OR paste numbers below</div>

        {/* Text area */}
        <div>
          <textarea
            rows={4}
            value={importText}
            onChange={e => handleTextChange(e.target.value)}
            placeholder={"254712345678, John Doe\n0712345678, Mary Wanjiku\n255612345678, Juma Ally"}
            className="w-full px-3 py-2 border border-[#2d2813] rounded-xl focus:outline-none focus:border-[#eab308] text-[11px] font-mono resize-none bg-[#181711] text-[#a8a99e] placeholder:text-[#6e684a]"
          />
        </div>

        {/* Duplicate handling */}
        {preview.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#6e684a] shrink-0">Duplicates:</span>
            <div className="flex gap-1">
              {(['skip', 'update'] as DuplicateMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setDuplicateMode(mode)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${duplicateMode === mode ? 'bg-[#eab308] text-[#181711]' : 'bg-[#2d2813] text-[#6e684a] hover:bg-[#3d3a1e]'}`}
                >
                  {mode === 'skip' ? 'Skip duplicates' : 'Update existing'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#6e684a] uppercase tracking-wide">
                Preview ({preview.length} rows)
              </span>
              <div className="flex items-center gap-2 text-[9px]">
                {invalidCount > 0 && <span className="text-red-400">{invalidCount} invalid</span>}
                {duplicateCount > 0 && <span className="text-amber-400">{duplicateCount} duplicate{duplicateCount !== 1 ? 's' : ''}</span>}
                {validCount > 0 && <span className="text-green-400">{validCount} will import</span>}
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto border border-[#2d2813] rounded-xl divide-y divide-[#2d2813]/50">
              {preview.slice(0, 20).map((p, i) => (
                <div key={i} className={`px-3 py-1.5 flex items-center justify-between ${p.isInvalid ? 'bg-red-900/20' : p.isDuplicate ? 'bg-amber-900/10' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-[10px] font-bold truncate ${p.isInvalid ? 'text-red-400' : 'text-[#a8a99e]'}`}>{p.name}</p>
                      {p.isInvalid && <span className="text-[8px] bg-red-900/50 text-red-400 px-1 rounded font-bold shrink-0">Invalid</span>}
                      {p.isDuplicate && !p.isInvalid && <span className="text-[8px] bg-amber-900/50 text-amber-400 px-1 rounded font-bold shrink-0">Duplicate</span>}
                    </div>
                    {p.isInvalid ? (
                      <p className="text-[9px] text-red-500">{p.invalidReason}</p>
                    ) : (
                      <p className="text-[9px] text-[#6e684a] font-mono">{p.phone}</p>
                    )}
                  </div>
                  {p.normalized && (
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-[10px] font-mono font-bold text-green-400">{p.normalized}</p>
                    </div>
                  )}
                </div>
              ))}
              {preview.length > 20 && (
                <div className="px-3 py-1.5 text-[10px] text-[#6e684a] text-center">
                  +{preview.length - 20} more rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 rounded-xl text-[11px] text-red-400 border border-red-900/50">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Progress bar */}
        {importing && importProgress > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[#6e684a]">
              <span>Importing contacts…</span>
              <span className="font-bold text-[#eab308]">{importProgress}%</span>
            </div>
            <div className="h-1.5 bg-[#2d2813] rounded-full overflow-hidden">
              <div className="h-full bg-[#eab308] rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
            </div>
          </div>
        )}

        {/* Import button */}
        <button
          onClick={handleImport}
          disabled={preview.length === 0 || importing || validCount === 0}
          className="w-full bg-[#eab308] hover:bg-yellow-400 text-[#181711] py-2.5 rounded-xl text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          <Upload className="w-3.5 h-3.5" />
          {importing ? 'Importing…' : `Import ${validCount} Contact${validCount !== 1 ? 's' : ''}${duplicateCount > 0 ? ` (${duplicateCount} skipped)` : ''}`}
        </button>
      </motion.div>
    </div>
  );
}
