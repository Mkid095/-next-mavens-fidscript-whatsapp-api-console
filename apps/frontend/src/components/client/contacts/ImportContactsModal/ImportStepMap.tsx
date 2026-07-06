import React from 'react';
import type { ColumnMapping } from './importUtils';

interface ImportStepMapProps {
  sampleLines: string[];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

export function ImportStepMap({ sampleLines, mapping, onMappingChange }: ImportStepMapProps) {
  // Parse sample lines to extract headers/cells
  const getCells = (line: string): string[] => {
    return line.split(/[,\t;]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
  };

  const headers = sampleLines.length > 0 ? getCells(sampleLines[0]) : [];
  const firstDataRow = sampleLines.length > 1 ? getCells(sampleLines[1]) : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-[#2d2813] flex items-center justify-center text-[#eab308] text-xs font-bold">3</div>
        <span className="text-[10px] font-bold text-[#6e684a] uppercase tracking-wide">Column Mapping</span>
      </div>
      <p className="text-[9px] text-[#5a554a]">Tell us which column contains phone numbers and which contains names.</p>

      {headers.length > 0 && (
        <div className="border border-[#2d2813] rounded-xl overflow-hidden">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-[#181711]">
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-1.5 text-left font-bold text-[#6e684a]">
                    {h || `Column ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {firstDataRow.length > 0 && (
                <tr className="border-t border-[#2d2813]">
                  {firstDataRow.map((cell, i) => (
                    <td key={i} className="px-3 py-1.5 text-[#a8a99e] font-mono truncate max-w-[120px]">{cell}</td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-[#6e684a] uppercase">Phone Column</label>
          <select
            value={mapping.phoneColumn}
            onChange={e => onMappingChange({ ...mapping, phoneColumn: Number(e.target.value) })}
            className="w-full px-2 py-1.5 text-[11px] border border-[#2d2813] rounded-xl bg-[#181711] text-[#a8a99e] focus:outline-none focus:border-[#eab308]"
          >
            {headers.map((h, i) => (
              <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-[#6e684a] uppercase">Name Column</label>
          <select
            value={mapping.nameColumn}
            onChange={e => onMappingChange({ ...mapping, nameColumn: Number(e.target.value) })}
            className="w-full px-2 py-1.5 text-[11px] border border-[#2d2813] rounded-xl bg-[#181711] text-[#a8a99e] focus:outline-none focus:border-[#eab308]"
          >
            <option value={-1}>No name column</option>
            {headers.map((h, i) => (
              <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] font-bold text-[#6e684a] uppercase">Delimiter</label>
        <div className="flex gap-1">
          {([',', '\t', ';'] as const).map(d => (
            <button
              key={d}
              onClick={() => onMappingChange({ ...mapping, delimiter: d })}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${mapping.delimiter === d ? 'bg-[#eab308] text-[#181711]' : 'bg-[#2d2813] text-[#6e684a] hover:bg-[#3d3a1e]'}`}
            >
              {d === ',' ? 'Comma' : d === '\t' ? 'Tab' : 'Semicolon'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
