import React from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ParsedRow } from './constants';

interface ImportStepConfirmProps {
  preview: ParsedRow[];
  importing: boolean;
  importProgress: number;
  error: string;
  successMsg: string;
  onImport: () => void;
}

export function ImportStepConfirm({
  preview, importing, importProgress, error, successMsg, onImport,
}: ImportStepConfirmProps) {
  const validCount = preview.filter(p => !p.isInvalid && !p.isDuplicate).length;
  const invalidCount = preview.filter(p => p.isInvalid).length;
  const duplicateCount = preview.filter(p => p.isDuplicate).length;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-xs font-bold text-[#a8a99e]">Ready to Import</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#2d2813] rounded-xl p-2">
            <p className="text-lg font-bold text-green-400">{validCount}</p>
            <p className="text-[9px] text-[#6e684a]">Will import</p>
          </div>
          <div className="bg-[#2d2813] rounded-xl p-2">
            <p className="text-lg font-bold text-amber-400">{duplicateCount}</p>
            <p className="text-[9px] text-[#6e684a]">Duplicates</p>
          </div>
          <div className="bg-[#2d2813] rounded-xl p-2">
            <p className="text-lg font-bold text-red-400">{invalidCount}</p>
            <p className="text-[9px] text-[#6e684a]">Invalid</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 rounded-xl text-[11px] text-red-400 border border-red-900/50">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 rounded-xl text-[11px] text-green-400 border border-green-900/50">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          {successMsg}
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
        onClick={onImport}
        disabled={preview.length === 0 || importing || validCount === 0}
        className="w-full bg-[#eab308] hover:bg-yellow-400 text-[#181711] py-2.5 rounded-xl text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
      >
        <Upload className="w-3.5 h-3.5" />
        {importing ? 'Importing…' : `Import ${validCount} Contact${validCount !== 1 ? 's' : ''}${duplicateCount > 0 ? ` (${duplicateCount} skipped)` : ''}`}
      </button>
    </div>
  );
}
