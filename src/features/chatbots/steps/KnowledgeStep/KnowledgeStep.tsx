/**
 * KnowledgeStep — Step 4 of the Chatbot Builder.
 *
 * Answers: "What does this chatbot know?"
 *
 * Supports adding knowledge sources:
 * - Website URL (scraped + indexed)
 * - FAQ (structured Q&A pairs)
 * - Plain Text
 * - JSON (structured data)
 * - PDF
 * - CSV
 * - Database (live query)
 * - API Endpoint (live fetch)
 */
import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import type { KnowledgeSource } from '../../types';
import { SourceCard } from './SourceCard';
import { AddSourceModal } from './AddSourceModal';
import { useIndexingSimulation } from './useIndexingSimulation';

export default function KnowledgeStep() {
  const { draft, updateKnowledge } = useChatbotBuilderStore();
  const { sources } = draft.knowledge;
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Trigger indexing simulation when sources change
  useIndexingSimulation(sources);

  const filteredSources = sources.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addSource = (source: Omit<KnowledgeSource, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newSource: KnowledgeSource = {
      ...source,
      id: `kn_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    updateKnowledge({ sources: [...sources, newSource] });
  };

  const removeSource = (id: string) => {
    updateKnowledge({ sources: sources.filter(s => s.id !== id) });
  };

  const reindexSource = (id: string) => {
    updateKnowledge({
      sources: sources.map(s =>
        s.id === id
          ? { ...s, status: 'indexing' as const, errorMessage: undefined, chunkCount: 0 }
          : s
      ),
    });
  };

  const toggleSource = (id: string) => {
    updateKnowledge({
      sources: sources.map(s =>
        s.id === id
          ? { ...s, status: s.status === 'disabled' ? 'active' : 'disabled', updatedAt: new Date().toISOString() }
          : s
      ),
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const reindexAll = () => {
    updateKnowledge({
      sources: sources.map(s => ({ ...s, status: 'indexing' as const, errorMessage: undefined, chunkCount: 0 })),
    });
  };

  const activeCount = sources.filter(s => s.status === 'active').length;
  const indexingCount = sources.filter(s => s.status === 'indexing').length;
  const errorCount = sources.filter(s => s.status === 'error').length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
        <BookOpen className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">Knowledge Sources</p>
          <p className="text-xs text-[#8f834a] mt-0.5">
            Add content your chatbot can use to answer questions accurately. Sources are automatically indexed and kept up to date.
          </p>
        </div>
        {sources.length > 0 && (
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {activeCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {activeCount} active
              </span>
            )}
            {indexingCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                {indexingCount} indexing
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <XCircle className="w-3 h-3" />
                {errorCount} error
              </span>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      {sources.length > 0 && (
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e684a]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search sources..."
              className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl pl-9 pr-3 py-2 text-white text-sm outline-none focus:border-yellow-500/50 transition placeholder:text-[#5a554a]"
            />
          </div>

          {/* Reindex all */}
          {activeCount > 0 && (
            <button
              onClick={reindexAll}
              disabled={indexingCount > 0}
              className="flex items-center gap-2 px-3 py-2 bg-[#1a1915] border border-[#2d2813] rounded-xl text-xs text-[#8f834a] hover:text-white hover:border-[#3d3823] transition disabled:opacity-40 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${indexingCount > 0 ? 'animate-spin' : ''}`} />
              Reindex all
            </button>
          )}
        </div>
      )}

      {/* Sources list */}
      {filteredSources.length > 0 && (
        <div className="space-y-2">
          {filteredSources.map(s => (
            <SourceCard
              key={s.id}
              source={s}
              isExpanded={expandedIds.has(s.id)}
              onToggleExpand={() => toggleExpand(s.id)}
              onRemove={() => removeSource(s.id)}
              onReindex={() => reindexSource(s.id)}
              onToggle={() => toggleSource(s.id)}
            />
          ))}
        </div>
      )}

      {/* Empty: no search results */}
      {sources.length > 0 && filteredSources.length === 0 && (
        <div className="text-center py-10">
          <Search className="w-8 h-8 mx-auto mb-2 text-[#3d3823]" />
          <p className="text-sm text-[#6e684a]">No sources match "{searchQuery}"</p>
          <button onClick={() => setSearchQuery('')} className="mt-2 text-xs text-yellow-400 hover:text-yellow-300">
            Clear search
          </button>
        </div>
      )}

      {/* Empty state: no sources */}
      {sources.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-[#2d2813] rounded-2xl">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-[#3d3823]" />
          <p className="text-sm font-semibold text-[#6e684a]">No knowledge sources yet</p>
          <p className="text-xs text-[#5a554a] mt-1 max-w-xs mx-auto">
            Add your first source — URLs, FAQs, text, JSON, or a database connection.
          </p>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0d0c0a] border border-dashed border-[#3d3823] hover:border-yellow-500/30 rounded-xl text-sm font-semibold text-[#8f834a] hover:text-white transition"
      >
        <Plus className="w-4 h-4" />
        Add Knowledge Source
      </button>

      {showAddModal && (
        <AddSourceModal onClose={() => setShowAddModal(false)} onAdd={addSource} />
      )}
    </div>
  );
}
