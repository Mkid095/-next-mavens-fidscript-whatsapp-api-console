/**
 * ProviderEmptyState — empty and no-results states.
 */
import { Bot, Search } from 'lucide-react';

interface Props {
  hasProviders: boolean;
  hasResults: boolean;
  isFiltering: boolean;
  onAdd: () => void;
  onClearFilters: () => void;
}

export function ProviderEmptyState({ hasProviders, hasResults, isFiltering, onAdd, onClearFilters }: Props) {
  if (!hasProviders) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#6e684a] bg-[#1a1915] border border-dashed border-[#2d2813] rounded-3xl">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#12110c] border border-[#2d2813] mb-4">
          <Bot size={26} className="opacity-50" />
        </div>
        <p className="text-sm font-semibold text-[#a8a99e]">No providers configured</p>
        <p className="text-[11px] mt-1">Add your first LLM provider to get started</p>
        <button onClick={onAdd}
          className="mt-4 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-yellow-500 text-[#11110a] rounded-xl hover:bg-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/40">
          + Add Provider
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#6e684a] bg-[#1a1915] border border-dashed border-[#2d2813] rounded-3xl">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#12110c] border border-[#2d2813] mb-3">
        <Search size={20} className="opacity-50" />
      </div>
      <p className="text-sm font-semibold text-[#a8a99e]">No providers match your filters</p>
      <p className="text-[11px] mt-1">Try adjusting the search or filters above</p>
      {isFiltering && (
        <button onClick={onClearFilters}
          className="mt-3 px-3 py-1.5 text-xs font-bold text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg transition-colors">
          Clear all filters
        </button>
      )}
    </div>
  );
}
