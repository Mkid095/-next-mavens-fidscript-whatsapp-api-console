import React from 'react';
import { Loader2, Check, Trash2 } from 'lucide-react';
import type { KnowledgeSource } from '../../types';

interface KnowledgeSourceItemProps {
  src: KnowledgeSource;
  onRemove: (id: string) => void;
}

export function KnowledgeSourceItem({ src, onRemove }: KnowledgeSourceItemProps) {
  return (
    <div className="flex items-center gap-2 p-2.5 bg-[#1a1915] rounded-lg border border-[#2d2813]">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{src.name}</p>
        <p className="text-[10px] text-[#6e684a]">
          {src.type} · {src.status === 'active' ? `${src.chunkCount} chunks` : src.status === 'indexing' ? 'Indexing...' : 'Error'}
        </p>
      </div>
      {src.status === 'active' && <Check size={12} className="text-emerald-400" />}
      {src.status === 'indexing' && <Loader2 size={12} className="text-yellow-400 animate-spin" />}
      <button onClick={() => onRemove(src.id)} className="p-1 text-[#6e684a] hover:text-red-400">
        <Trash2 size={12} />
      </button>
    </div>
  );
}
