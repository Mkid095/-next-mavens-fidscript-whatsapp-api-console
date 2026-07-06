import { useState, useRef, useEffect, useCallback } from 'react';
import { contactsApi, openGoogleOAuthPopup } from '../../../../services/contacts';
import type { ParsedRow, ImportResult, DuplicateMode } from './constants';
import { normalizeNumber, detectCountry, parseImportText, detectDelimiter, detectHeaderRow, parseCSVLine, autoDetectColumns } from './importUtils';
import type { ColumnMapping } from './importUtils';

interface UseImportModalOptions {
  existingPhones?: Set<string>;
  onContactsImported: (newContacts: { id: string; phone: string; name: string; created_at: string }[]) => void;
  onClose: () => void;
}

export type ImportStep = 'upload' | 'parse' | 'map' | 'confirm';

export function useImportModal({ existingPhones, onContactsImported, onClose }: UseImportModalOptions) {
  const [step, setStep] = useState<ImportStep>('upload');
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

  const [mapping, setMapping] = useState<ColumnMapping>({ phoneColumn: 0, nameColumn: 1, delimiter: ',' });
  const [sampleLines, setSampleLines] = useState<string[]>([]);

  const [googleStatus, setGoogleStatus] = useState<{ linked: boolean; name?: string; email?: string; picture?: string } | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [googleResult, setGoogleResult] = useState<ImportResult | null>(null);

  useEffect(() => { countryRef.current = selectedCountry; }, [selectedCountry]);

  useEffect(() => {
    contactsApi.googleStatus().then(res => {
      if (res.success) setGoogleStatus(res.data ?? { linked: false });
    }).catch(() => setGoogleStatus({ linked: false }));
  }, []);

  // Detect sample lines for column mapping UI
  useEffect(() => {
    if (!importText.trim()) { setSampleLines([]); return; }
    const lines = importText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    setSampleLines(lines.slice(0, 3));
  }, [importText]);

  const parseAndPreview = useCallback((text: string, country: string, colMapping: ColumnMapping, phones?: Set<string>) => {
    const parsed = parseImportText(text, country, colMapping, phones);
    setPreview(parsed);
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setImportText(text);
    setError(''); setSuccessMsg(''); setGoogleResult(null);
    if (!text.trim()) { setPreview([]); setSampleLines([]); return; }
    const detected = detectCountry(text);
    if (!detectedCountry && detected) {
      setDetectedCountry(detected); setSelectedCountry(detected);
    }
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const { dataStartIndex } = detectHeaderRow(lines);
    const delimiter = detectDelimiter(lines[0] || '');
    const autoMapping = autoDetectColumns(
      dataStartIndex > 0 ? parseCSVLine(lines[0], delimiter) : [],
      lines.slice(dataStartIndex, dataStartIndex + 1).map(l => parseCSVLine(l, delimiter)),
    );
    const resolvedMapping = { ...autoMapping, delimiter };
    setMapping(resolvedMapping);
    parseAndPreview(text, countryRef.current, resolvedMapping, existingPhones);
  }, [detectedCountry, existingPhones, parseAndPreview]);

  const handleCountryChange = useCallback((code: string) => {
    setSelectedCountry(code); setDetectedCountry(code); setShowCountryPicker(false);
    if (importText.trim()) parseAndPreview(importText, code, mapping, existingPhones);
  }, [importText, existingPhones, mapping, parseAndPreview]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const countryFromFile = detectCountry(text);
    const country = countryFromFile || countryRef.current;
    if (countryFromFile) { setDetectedCountry(countryFromFile); setSelectedCountry(countryFromFile); }
    setImportText(text);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const { dataStartIndex } = detectHeaderRow(lines);
    const delimiter = detectDelimiter(lines[0] || '');
    const autoMapping = autoDetectColumns(
      dataStartIndex > 0 ? parseCSVLine(lines[0], delimiter) : [],
      lines.slice(dataStartIndex, dataStartIndex + 1).map(l => parseCSVLine(l, delimiter)),
    );
    const resolvedMapping = { ...autoMapping, delimiter };
    setMapping(resolvedMapping);
    parseAndPreview(text, country, resolvedMapping, existingPhones);
  }, [existingPhones, parseAndPreview]);

  const handleMappingChange = useCallback((newMapping: ColumnMapping) => {
    setMapping(newMapping);
    if (importText.trim()) parseAndPreview(importText, countryRef.current, newMapping, existingPhones);
  }, [importText, existingPhones, parseAndPreview]);

  const handleGoToParse = useCallback(() => {
    if (preview.length > 0) setStep('parse');
  }, [preview]);

  const handleGoToMap = useCallback(() => {
    setStep('map');
  }, []);

  const handleGoToConfirm = useCallback(() => {
    setStep('confirm');
  }, []);

  const handleImport = useCallback(async () => {
    if (preview.length === 0) return;
    const toImport = preview.filter(p => !p.isInvalid && !p.isDuplicate);
    if (toImport.length === 0) { setError('No valid contacts to import'); return; }
    const BATCH_SIZE = 50;
    setImporting(true); setError(''); setSuccessMsg(''); setGoogleResult(null); setImportProgress(0);
    try {
      const allContacts = toImport.map(p => ({ phone: p.normalized, name: p.name }));
      const batches: typeof allContacts[] = [];
      for (let i = 0; i < allContacts.length; i += BATCH_SIZE) batches.push(allContacts.slice(i, i + BATCH_SIZE));
      let totalImported = 0;
      for (let i = 0; i < batches.length; i++) {
        const res = await contactsApi.importBatch(batches[i]);
        if (!res.success) { setError(res.error || `Import failed on batch ${i + 1}`); setImporting(false); return; }
        totalImported += batches[i].length;
        setImportProgress(Math.round((totalImported / allContacts.length) * 100));
      }
      const newContacts = allContacts.map((c, i) => ({ id: `contact-${Date.now()}-${i}`, phone: c.phone, name: c.name, created_at: new Date().toISOString() }));
      setSuccessMsg(`Successfully imported ${totalImported} contact${totalImported !== 1 ? 's' : ''}`);
      onContactsImported(newContacts);
      setTimeout(onClose, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : 'Import failed'); }
    finally { setImporting(false); }
  }, [preview, onContactsImported, onClose]);

  const handleLinkGoogle = useCallback(async () => {
    setGoogleError(''); setGoogleLoading(true);
    try {
      await openGoogleOAuthPopup();
      const res = await contactsApi.googleStatus();
      if (res.success) setGoogleStatus(res.data ?? { linked: false });
    } catch (err) { setGoogleError(err instanceof Error ? err.message : 'Failed to link Google account'); }
    finally { setGoogleLoading(false); }
  }, []);

  const handleUnlinkGoogle = useCallback(async () => {
    try { await contactsApi.googleUnlink(); setGoogleStatus({ linked: false }); setGoogleResult(null); } catch {}
  }, []);

  const handleGoogleSync = useCallback(async () => {
    setGoogleError(''); setGoogleSyncing(true); setSuccessMsg(''); setGoogleResult(null);
    try {
      const res = await contactsApi.googleImport();
      if (res.success && res.data) {
        setGoogleResult(res.data);
        setSuccessMsg(`Google sync complete: ${res.data.imported} imported, ${res.data.errors} errors`);
        const all = await contactsApi.getAll();
        if (all.success && all.data) onContactsImported(all.data.map(c => ({ id: c.id, phone: c.phone, name: c.name, created_at: c.created_at })));
      } else { setGoogleError(res.error || 'Sync failed'); }
    } catch (err) { setGoogleError(err instanceof Error ? err.message : 'Sync failed'); }
    finally { setGoogleSyncing(false); }
  }, [onContactsImported]);

  return {
    step, setStep,
    importText, setImportText,
    importing, importProgress,
    selectedCountry, detectedCountry, showCountryPicker,
    preview, error, successMsg, duplicateMode, fileInputRef,
    googleStatus, googleLoading, googleSyncing, googleError, googleResult,
    mapping, sampleLines,
    validCount: preview.filter(p => !p.isInvalid && !p.isDuplicate).length,
    handleTextChange, handleCountryChange, handleFileChange, handleMappingChange,
    handleGoToParse, handleGoToMap, handleGoToConfirm, handleImport,
    handleLinkGoogle, handleUnlinkGoogle, handleGoogleSync,
    setShowCountryPicker, setDuplicateMode,
  };
}
