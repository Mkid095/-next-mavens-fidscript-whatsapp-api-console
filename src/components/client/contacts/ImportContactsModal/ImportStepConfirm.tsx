import React from 'react';
import { AlertCircle, Upload } from 'lucide-react';

interface ImportStepConfirmProps {
  error: string;
  importing: boolean;
  importProgress: number;
  validCount: number;
  duplicateCount: number;
  previewLength: number;
  onImport: () => void;
}

export default function ImportStepConfirm({
  error,
  importing,
  importProgress,
  validCount,
  duplicateCount,
  previewLength,
  onImport,
}: ImportStepConfirmProps) {
  return (
    <>
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
        onClick={onImport}
        disabled={previewLength === 0 || importing || validCount === 0}
        className="w-full bg-[#eab308] hover:bg-yellow-400 text-[#181711] py-2.5 rounded-xl text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
      >
        <Upload className="w-3.5 h-3.5" />
        {importing ? 'Importing…' : `Import ${validCount} Contact${validCount !== 1 ? 's' : ''}${duplicateCount > 0 ? ` (${duplicateCount} skipped)` : ''}`}
      </button>
    </>
  );
}
