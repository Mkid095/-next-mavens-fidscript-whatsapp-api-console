/**
 * KnowledgeList — list of knowledge source items + empty states.
 */
import React from 'react';
import { Search, BookOpen } from 'lucide-react';
import type { KnowledgeSource } from '../../types';
import { KnowledgeItem } from './KnowledgeItem';

export function KnowledgeList({
  sources,
  expandedIds,
  onToggleExpand,
  onRemove,
  onReindex,
  onToggle,
  searchQuery,
  onClearSearch,
}: {
  sources: KnowledgeSource[];
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onRemove: (id: string) => void;
  onReindex: (id: string) => void;
  onToggle: (id: string) => void;
  searchQuery: string;
  onClearSearch: () => void;
}) {
  if (sources.length > 0) {
    return (
      <div className="space-y-2">
        {sources.map(s => (
          <KnowledgeItem
            key={s.id}
            source={s}
            isExpanded={expandedIds.has(s.id)}
            onToggleExpand={() => onToggleExpand(s.id)}
            onRemove={() => onRemove(s.id)}
            onReindex={() => onReindex(s.id)}
            onToggle={() => onToggle(s.id)}
          />
        ))}
      </div>
    );
  }

  if (searchQuery) {
    return (
      <div className="text-center py-10">
        <Search className="w-8 h-8 mx-auto mb-2 text-[#3d3823]" />
        <p className="text-sm text-[#6e684a]">No sources match "{searchQuery}"</p>
        <button onClick={onClearSearch} className="mt-2 text-xs text-yellow-400 hover:text-yellow-300">
          Clear search
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-12 border-2 border-dashed border-[#2d2813] rounded-2xl">
      <BookOpen className="w-12 h-12 mx-auto mb-3 text-[#3d3823]" />
      <p className="text-sm font-semibold text-[#6e684a]">No knowledge sources yet</p>
      <p className="text-xs text-[#5a554a] mt-1 max-w-xs mx-auto">
        Add your first source — URLs, FAQs, text, JSON, or a database connection.
      </p>
    </div>
  );
}
