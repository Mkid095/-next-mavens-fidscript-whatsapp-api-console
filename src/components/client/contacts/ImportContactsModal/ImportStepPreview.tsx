import React from 'react';

interface ParsedRow {
  phone: string;
  name: string;
  normalized: string;
  isDuplicate: boolean;
  isInvalid: boolean;
  invalidReason?: string;
}

interface ImportStepPreviewProps {
  preview: ParsedRow[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
}

export default function ImportStepPreview({ preview, validCount, invalidCount, duplicateCount }: ImportStepPreviewProps) {
  return (
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
  );
}
