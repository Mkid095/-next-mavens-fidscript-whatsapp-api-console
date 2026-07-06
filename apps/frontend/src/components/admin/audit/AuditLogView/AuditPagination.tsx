import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPrev: () => void;
  onNext: () => void;
}

export function AuditPagination({ page, totalPages, total, limit, onPrev, onNext }: AuditPaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 shrink-0">
      <span className="text-[9px] text-stone-400">
        {total === 0 ? 'No events' : `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total.toLocaleString()}`}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-stone-200 disabled:opacity-30 hover:bg-stone-50 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-stone-600" />
        </button>
        <span className="text-[10px] font-mono text-stone-600 px-2">{page} / {totalPages || 1}</span>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-stone-200 disabled:opacity-30 hover:bg-stone-50 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
        </button>
      </div>
    </div>
  );
}
