/**
 * ToolItem — individual tool row (attached or available).
 */
import React from 'react';
import {
  Wrench,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Check,
  Loader2,
  Plus,
} from 'lucide-react';

const TYPE_BADGES: Record<string, string> = {
  lookup: 'text-blue-400 bg-blue-900/30 border-blue-900/50',
  search: 'text-cyan-400 bg-cyan-900/30 border-cyan-900/50',
  query: 'text-green-400 bg-green-900/30 border-green-900/50',
  action: 'text-orange-400 bg-orange-900/30 border-orange-900/50',
  workflow: 'text-purple-400 bg-purple-900/30 border-purple-900/50',
  'http-request': 'text-orange-400 bg-orange-900/30 border-orange-900/50',
  'database-query': 'text-green-400 bg-green-900/30 border-green-900/50',
};

interface ToolItemProps {
  tool: {
    id: string;
    name: string;
    description: string;
    type: string;
    implementation?: string;
    approved?: number;
    requires_confirmation?: number;
    data_source_name?: string;
  };
  isAttached: boolean;
  busy: boolean;
  onDetach: () => void;
  onAttach: () => void;
  onApprove: () => void;
}

export function ToolItem({ tool, isAttached, busy, onDetach, onAttach, onApprove }: ToolItemProps) {
  const isPending = tool.approved === 0;
  const isDangerous = Boolean(tool.requires_confirmation);
  const typeBadge = TYPE_BADGES[tool.type] ?? TYPE_BADGES[tool.implementation ?? ''] ?? 'text-[#6e684a] bg-[#181711] border-[#2d2813]';

  if (isAttached) {
    return (
      <div className="flex items-start gap-3 p-4 bg-[#0d0c0a] border border-[#2d2813] rounded-xl">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Wrench className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-sm font-semibold text-white truncate">{tool.name}</p>
            <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold border uppercase ${typeBadge}`}>
              {tool.type}
            </span>
            {isDangerous && (
              <span className="shrink-0 flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-red-900/50 bg-red-900/30 text-red-400 uppercase">
                <ShieldAlert className="w-2.5 h-2.5" /> Confirm
              </span>
            )}
            {isPending ? (
              <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-yellow-900/50 bg-yellow-900/30 text-yellow-400 uppercase">Pending</span>
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-[#6e684a] mt-0.5 line-clamp-2">{tool.description}</p>
          {tool.data_source_name && (
            <p className="text-[9px] text-[#5a554a] font-mono mt-0.5">📁 {tool.data_source_name}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {isPending && (
            <button
              onClick={onApprove}
              disabled={busy}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-[9px] font-bold rounded-lg disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> Approve
            </button>
          )}
          <button
            onClick={onDetach}
            disabled={busy}
            className="flex items-center gap-1 px-2 py-1 text-[#6e684a] hover:text-red-400 text-[9px] font-bold rounded-lg transition disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Detach
          </button>
        </div>
      </div>
    );
  }

  // Available (not attached)
  return (
    <div className="flex items-start gap-3 p-3 bg-[#0d0c0a] border border-[#2d2813] rounded-xl opacity-80 hover:opacity-100 transition">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[#cbd3cf] truncate">{tool.name}</p>
          <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold border uppercase ${typeBadge}`}>
            {tool.type}
          </span>
          {isPending && (
            <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-yellow-900/50 bg-yellow-900/30 text-yellow-400 uppercase">Needs approval</span>
          )}
        </div>
        <p className="text-[10px] text-[#6e684a] mt-0.5 line-clamp-1">{tool.description}</p>
      </div>
      <button
        onClick={onAttach}
        disabled={busy}
        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black text-[10px] font-bold rounded-lg shrink-0"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        Attach
      </button>
    </div>
  );
}
