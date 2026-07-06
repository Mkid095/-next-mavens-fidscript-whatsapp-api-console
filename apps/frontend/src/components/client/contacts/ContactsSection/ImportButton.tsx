import React from 'react';
import { Trash2, FileUp, UserPlus } from 'lucide-react';

interface ImportButtonProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onShowImport: () => void;
  onShowAdd: () => void;
}

export default function ImportButton({
  selectedCount,
  onDeleteSelected,
  onShowImport,
  onShowAdd,
}: ImportButtonProps) {
  return (
    <div className="flex items-center gap-2">
      {selectedCount > 0 && (
        <button
          onClick={onDeleteSelected}
          className="px-3 py-1.5 bg-red-900/30 text-red-400 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-red-900/50 transition-all border border-red-900/50"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedCount})
        </button>
      )}
      <button
        onClick={onShowImport}
        className="px-3.5 py-1.5 bg-[#2d2813] text-[#a8a99e] text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#3d3a1e] transition-all border border-[#3d3a1e]"
      >
        <FileUp className="w-3.5 h-3.5" /> Import
      </button>
      <button
        onClick={onShowAdd}
        className="px-3.5 py-1.5 bg-[#eab308] text-[#181711] text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-yellow-400 transition-all"
      >
        <UserPlus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
