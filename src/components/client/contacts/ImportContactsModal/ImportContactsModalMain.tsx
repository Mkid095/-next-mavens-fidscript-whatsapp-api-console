import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { contactsApi, openGoogleOAuthPopup } from '../../../../services/contacts';
import { normalizeNumber, detectCountry } from './import-contacts-country.utils';
import GoogleOAuthSection from './GoogleOAuthSection';
import ImportStepUpload from './ImportStepUpload';
import ImportStepPreview from './ImportStepPreview';
import ImportStepConfirm from './ImportStepConfirm';

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
  const [googleStatus, setGoogleStatus] = useState<{ linked: boolean; name?: string; email?: string; picture?: string } | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleError, setGoogleError] = useState('');
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
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      contactsApi.googleStatus().then(res => {
        if (res.success) setGoogleStatus(res.data ?? { linked: false });
      });
    }
    const googleErr = params.get('google_error');
    if (googleErr) {
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      const raw = decodeURIComponent(googleErr);
      let friendly = raw;
      if (raw === 'access_denied') {
        friendly = 'Permission denied - please grant Contacts access to import your address book.';
      } else if (raw === 'redirect_uri_mismatch') {
        friendly = 'OAuth configuration error: redirect URI mismatch. Contact support.';
      } else if (raw === 'invalid_state' || raw === 'missing_params') {
        friendly = 'OAuth session expired - please try again.';
      }
      setGoogleError(friendly);
      setTimeout(() => setGoogleError(''), 8000);
    }
  }, []);

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

  const handleLinkGoogle = async () => {
    setGoogleError('');
    setGoogleLoading(true);
    try {
      await openGoogleOAuthPopup();
      const res = await contactsApi.googleStatus();
      if (res.success) setGoogleStatus(res.data ?? { linked: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to link Google account';
      console.error('[GoogleOAuth] link error:', msg);
      setGoogleError(msg);
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

        {/* Google OAuth Section */}
        <GoogleOAuthSection
          googleStatus={googleStatus}
          googleLoading={googleLoading}
          googleSyncing={googleSyncing}
          googleError={googleError}
          onLink={handleLinkGoogle}
          onUnlink={handleUnlinkGoogle}
          onSync={handleGoogleSync}
        />

        {/* Success message */}
        {successMsg && !googleError && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 rounded-xl text-[11px] text-green-400 border border-green-900/50">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            {successMsg}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#2d2813]" />
          <span className="text-[9px] text-[#6e684a] font-semibold uppercase tracking-widest">or import from file</span>
          <div className="flex-1 h-px bg-[#2d2813]" />
        </div>

        {/* Upload steps */}
        <ImportStepUpload
          importText={importText}
          selectedCountry={selectedCountry}
          detectedCountry={detectedCountry}
          showCountryPicker={showCountryPicker}
          previewLength={preview.length}
          duplicateMode={duplicateMode}
          onTextChange={handleTextChange}
          onCountryChange={handleCountryChange}
          onToggleCountryPicker={() => setShowCountryPicker(v => !v)}
          onFileChange={handleFileChange}
          onDuplicateModeChange={setDuplicateMode}
          onDownloadTemplate={downloadTemplate}
          fileInputRef={fileInputRef}
        />

        {/* Preview */}
        {preview.length > 0 && (
          <ImportStepPreview
            preview={preview}
            validCount={validCount}
            invalidCount={invalidCount}
            duplicateCount={duplicateCount}
          />
        )}

        {/* Confirm step */}
        <ImportStepConfirm
          error={error}
          importing={importing}
          importProgress={importProgress}
          validCount={validCount}
          duplicateCount={duplicateCount}
          previewLength={preview.length}
          onImport={handleImport}
        />
      </motion.div>
    </div>
  );
}
