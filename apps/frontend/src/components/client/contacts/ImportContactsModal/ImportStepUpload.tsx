import React, { useRef } from 'react';
import { Download } from 'lucide-react';
import type { ParsedRow, DuplicateMode } from './constants';
import { COUNTRY_OPTIONS } from './constants';

interface UploadStepProps {
  importText: string;
  selectedCountry: string;
  detectedCountry: string;
  showCountryPicker: boolean;
  duplicateMode: DuplicateMode;
  preview: ParsedRow[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onTextChange: (text: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCountryToggle: () => void;
  onCountryChange: (code: string) => void;
  onDuplicateModeChange: (mode: DuplicateMode) => void;
}

export function ImportStepUpload(props: UploadStepProps) {
  const { importText, selectedCountry, detectedCountry, showCountryPicker, duplicateMode, preview, fileInputRef, onTextChange, onFileChange, onCountryToggle, onCountryChange, onDuplicateModeChange } = props;
  const selectedCountryData = COUNTRY_OPTIONS.find(c => c.code === selectedCountry);
  const validCount = preview.filter(p => !p.isInvalid && !p.isDuplicate).length;
  const duplicateCount = preview.filter(p => p.isDuplicate).length;

  const downloadTemplate = () => {
    const csv = `phone,name\n${selectedCountry}712345678,John Doe\n${selectedCountry}701234567,Mary Wanjiku\n${selectedCountry}800000001,Sam Otieno`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "contacts_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#2d2813]" />
        <span className="text-[9px] text-[#6e684a] font-semibold uppercase tracking-widest">or import from file</span>
        <div className="flex-1 h-px bg-[#2d2813]" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-[#6e684a] uppercase tracking-wide">Default Country</label>
        <p className="text-[9px] text-[#5a554a]">Auto-prefixes local numbers (e.g. 0712… → +254 712…)</p>
        <div className="relative">
          <button onClick={onCountryToggle}
            className="w-full px-3 py-2 text-xs border border-[#2d2813] rounded-xl focus:outline-none focus:border-[#eab308] bg-[#181711] text-[#a8a99e] flex items-center justify-between hover:bg-[#2d2813] transition-all">
            <span className="font-bold">{selectedCountryData?.code} {selectedCountryData?.country}</span>
            <svg className="w-3.5 h-3.5 text-[#6e684a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCountryPicker && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1915] border border-[#2d2813] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
              {COUNTRY_OPTIONS.map(c => (
                <button key={c.code} onClick={() => onCountryChange(c.code)}
                  className={`w-full px-3 py-2 text-left text-[11px] hover:bg-[#3d3a1e] flex items-center gap-2 ${selectedCountry === c.code ? 'bg-[#eab308]/10 font-bold text-[#eab308]' : 'text-[#6e684a]'}`}>
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
            Country detected: {COUNTRY_OPTIONS.find(c => c.code === detectedCountry)?.country}
          </div>
        )}
      </div>
      <div>
        <label className="text-[10px] font-bold text-[#6e684a] uppercase tracking-wide mb-1 block">Upload CSV or TXT</label>
        <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={onFileChange}
          className="w-full text-xs border border-[#2d2813] rounded-xl p-2 bg-[#181711] text-[#6e684a] file:mr-3 file:text-[10px] file:font-bold file:text-[#eab308] file:bg-[#2d2813] file:rounded-lg file:px-2 file:py-1 file:border-0 hover:file:bg-[#3d3a1e] file:transition-all cursor-pointer" />
        <button onClick={downloadTemplate}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-[#2d2813] hover:bg-[#3d3a1e] text-[#6e684a] py-2 rounded-xl text-[11px] font-bold border border-[#3d3a1e] transition-all">
          <Download className="w-3 h-3" /> Download Template
        </button>
      </div>
      <div className="text-center text-[9px] text-[#5a554a] font-semibold">OR paste numbers below</div>
      <textarea rows={4} value={importText} onChange={e => onTextChange(e.target.value)}
        placeholder={"254712345678, John Doe\n0712345678, Mary Wanjiku\n255612345678, Juma Ally"}
        className="w-full px-3 py-2 border border-[#2d2813] rounded-xl focus:outline-none focus:border-[#eab308] text-[11px] font-mono resize-none bg-[#181711] text-[#a8a99e] placeholder:text-[#6e684a]" />
      {preview.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-[#6e684a] shrink-0">Duplicates:</span>
          <div className="flex gap-1">
            {(['skip', 'update'] as DuplicateMode[]).map(mode => (
              <button key={mode} onClick={() => onDuplicateModeChange(mode)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${duplicateMode === mode ? 'bg-[#eab308] text-[#181711]' : 'bg-[#2d2813] text-[#6e684a] hover:bg-[#3d3a1e]'}`}>
                {mode === 'skip' ? 'Skip duplicates' : 'Update existing'}
              </button>
            ))}
          </div>
          <span className="text-[9px] text-[#5a554a] ml-auto">{validCount} will import{duplicateCount > 0 ? ` (${duplicateCount} skipped)` : ''}</span>
        </div>
      )}
    </>
  );
}
