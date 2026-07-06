/**
 * KnowledgeStep — Step 4 of the Chatbot Builder.
 * Thin shell: owns state, delegates to sub-components.
 */
import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, RefreshCw, Search } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import type { KnowledgeSource } from '../../types';
import { KnowledgeItem } from './KnowledgeItem';
import { KnowledgeList } from './KnowledgeList';
import { KnowledgeEditor } from './KnowledgeEditor';

// ─── Mock indexing simulation hook ────────────────────────────────────────────

function useIndexingSimulation(sources: KnowledgeSource[]) {
  const { updateKnowledge } = useChatbotBuilderStore();

  useEffect(() => {
    sources.forEach(source => {
      if (source.status === 'indexing') {
        const delay = source.type === 'pdf' || source.type === 'database'
          ? 3500
          : source.type === 'csv' || source.type === 'json'
          ? 2000
          : 1200;

        const timer = setTimeout(() => {
          const succeeded = Math.random() > 0.1;
          const mockChunks = Math.floor(Math.random() * 80) + 10;
          updateKnowledge({
            sources: useChatbotBuilderStore.getState().draft.knowledge.sources.map(s =>
              s.id === source.id
                ? {
                    ...s,
                    status: succeeded ? 'active' : 'error',
                    chunkCount: succeeded ? mockChunks : s.chunkCount,
                    errorMessage: succeeded ? undefined : 'Failed to reach URL or parse content',
                    updatedAt: new Date().toISOString(),
                  }
                : s
            ),
          });
        }, delay);
        return () => clearTimeout(timer);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources.map(s => s.status).join(',')]);
}

// ─── Step ─────────────────────────────────────────────────────────────────────

export default function KnowledgeStep() {
  const { draft, updateKnowledge } = useChatbotBuilderStore();
  const { sources } = draft.knowledge;
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useIndexingSimulation(sources);

  const filteredSources = sources.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addSource = (source: Omit<KnowledgeSource, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newSource: KnowledgeSource = { ...source, id: `kn_${Date.now()}`, createdAt: now, updatedAt: now };
    updateKnowledge({ sources: [...sources, newSource] });
  };

  const removeSource = (id: string) => updateKnowledge({ sources: sources.filter(s => s.id !== id) });

  const reindexSource = (id: string) => {
    updateKnowledge({
      sources: sources.map(s =>
        s.id === id ? { ...s, status: 'indexing' as const, errorMessage: undefined, chunkCount: 0 } : s
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
      next.has(id) ? next.delete(id) : next.add(id);
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
            {activeCount > 0 && <span className="flex items-center gap-1 text-xs text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />{activeCount} active</span>}
            {indexingCount > 0 && <span className="flex items-center gap-1 text-xs text-yellow-400"><RefreshCw className="w-3 h-3 animate-spin" />{indexingCount} indexing</span>}
            {errorCount > 0 && <span className="flex items-center gap-1 text-xs text-red-400">✕{errorCount} error</span>}
          </div>
        )}
      </div>

      {/* Toolbar */}
      {sources.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e684a]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search sources..."
              className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl pl-9 pr-3 py-2 text-white text-sm outline-none focus:border-yellow-500/50 transition placeholder:text-[#5a554a]"
            />
          </div>
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
      <KnowledgeList
        sources={filteredSources}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onRemove={removeSource}
        onReindex={reindexSource}
        onToggle={toggleSource}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery('')}
      />

      {/* Add button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0d0c0a] border border-dashed border-[#3d3823] hover:border-yellow-500/30 rounded-xl text-sm font-semibold text-[#8f834a] hover:text-white transition"
      >
        <Plus className="w-4 h-4" />
        Add Knowledge Source
      </button>

      {showAddModal && (
        <KnowledgeEditor onClose={() => setShowAddModal(false)} onAdd={addSource} />
      )}
    </div>
  );
}
