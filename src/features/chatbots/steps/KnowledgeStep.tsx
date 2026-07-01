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
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Globe,
  ExternalLink,
  AlertCircle,
  Loader2,
  Search,
  ChevronDown,
  X,
  Link,
  FileText,
  FileSpreadsheet,
  Server,
  Code,
} from 'lucide-react';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import { type KnowledgeSource, type KnowledgeSourceType } from '../types';

// ─── Source type definitions ─────────────────────────────────────────────────

const SOURCE_TYPES: {
  value: KnowledgeSourceType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}[] = [
  { value: 'url',      label: 'Website URL',    description: 'Scrape content from a webpage',          icon: Link,        color: 'blue'   },
  { value: 'faq',      label: 'FAQ',             description: 'Structured question & answer pairs',      icon: FileText,   color: 'purple' },
  { value: 'text',     label: 'Plain Text',     description: 'Paste or write free-form text',          icon: FileText,   color: 'yellow' },
  { value: 'json',     label: 'JSON',            description: 'Structured data (products, inventory)', icon: Database,   color: 'orange' },
  { value: 'pdf',      label: 'PDF',             description: 'Upload a PDF document',                  icon: FileText,   color: 'red'    },
  { value: 'csv',      label: 'CSV',             description: 'Spreadsheet or table data',              icon: FileSpreadsheet, color: 'green'  },
  { value: 'database', label: 'Database',       description: 'Connect to your database',              icon: Server,     color: 'cyan'   },
  { value: 'api',      label: 'API Endpoint',   description: 'Fetch data from an external API',       icon: Code,       color: 'pink'   },
];

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active:    { label: 'Active',    icon: CheckCircle2, color: 'text-green-400',    bg: 'bg-green-400/10',    border: 'border-green-400/20'  },
  indexing:  { label: 'Indexing',   icon: Loader2,      color: 'text-yellow-400',   bg: 'bg-yellow-400/10',  border: 'border-yellow-400/20' },
  error:     { label: 'Error',      icon: XCircle,      color: 'text-red-400',       bg: 'bg-red-400/10',     border: 'border-red-400/20'   },
  disabled:  { label: 'Disabled',   icon: AlertCircle,  color: 'text-[#6e684a]',     bg: 'bg-[#2d2813]',       border: 'border-[#2d2813]'     },
} as const;

type SourceStatus = keyof typeof STATUS_CONFIG;

// ─── Mock indexing: transitions source status after delay ────────────────────

function useIndexingSimulation(sources: KnowledgeSource[]) {
  const { updateKnowledge } = useChatbotBuilderStore();

  useEffect(() => {
    sources.forEach(source => {
      if (source.status === 'indexing') {
        // Simulate indexing delay: 1.5–4s based on source type
        const delay = source.type === 'pdf' || source.type === 'database'
          ? 3500
          : source.type === 'csv' || source.type === 'json'
          ? 2000
          : 1200;

        const timer = setTimeout(() => {
          // Simulate 90% success rate
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

// ─── Source card ─────────────────────────────────────────────────────────────

function SourceCard({
  source,
  onRemove,
  onReindex,
  onToggle,
  isExpanded,
  onToggleExpand,
}: {
  source: KnowledgeSource;
  onRemove: () => void;
  onReindex: () => void;
  onToggle: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const statusCfg = STATUS_CONFIG[source.status as SourceStatus];
  const typeMeta = SOURCE_TYPES.find(t => t.value === source.type);

  const chunkBarPct = Math.min((source.chunkCount / 100) * 100, 100);

  return (
    <div className={`border rounded-xl overflow-hidden transition ${
      source.status === 'error'
        ? 'border-red-400/20 bg-red-400/5'
        : source.status === 'active'
        ? 'border-[#2d2813] bg-[#0d0c0a]'
        : 'border-[#2d2813] bg-[#0d0c0a]'
    }`}>
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          source.status === 'active' ? 'bg-[#1a1915] text-[#6e684a]' : 'bg-[#1a1915] opacity-60 text-[#5a554a]'
        }`}>
          {(() => { const Icon = typeMeta?.icon ?? FileText; return <Icon size={18} />; })()}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleExpand}
              className="text-sm font-semibold text-white text-left truncate hover:text-yellow-300 transition"
            >
              {source.name}
            </button>
            <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
              {source.status === 'indexing' ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  Indexing
                </span>
              ) : statusCfg.label}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-[#6e684a]">{typeMeta?.label}</span>
            {source.status === 'active' && source.chunkCount > 0 && (
              <>
                <span className="text-[10px] text-[#5a554a]">·</span>
                <span className="text-[10px] text-[#6e684a]">{source.chunkCount} chunks</span>
              </>
            )}
            {source.ref && (
              <>
                <span className="text-[10px] text-[#5a554a]">·</span>
                <span className="text-[10px] text-[#5a554a] truncate max-w-[160px] font-mono">{source.ref}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {source.status !== 'indexing' && (
            <button
              onClick={onReindex}
              title="Re-index source"
              className="p-1.5 text-[#6e684a] hover:text-yellow-400 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onToggle}
            title={source.status === 'disabled' ? 'Enable source' : 'Disable source'}
            className={`p-1.5 transition ${source.status === 'disabled' ? 'text-[#6e684a] hover:text-green-400' : 'text-[#6e684a] hover:text-red-400'}`}
          >
            {source.status === 'disabled' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onRemove}
            title="Remove source"
            className="p-1.5 text-[#6e684a] hover:text-red-400 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[#2d2813] pt-3 space-y-3">
          {/* Error message */}
          {source.status === 'error' && source.errorMessage && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{source.errorMessage}</span>
            </div>
          )}

          {/* Chunk health bar */}
          {source.status === 'active' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#6e684a]">Index coverage</span>
                <span className="text-white font-mono">{source.chunkCount} chunks</span>
              </div>
              <div className="h-1.5 bg-[#2d2813] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    source.chunkCount >= 60
                      ? 'bg-green-400'
                      : source.chunkCount >= 20
                      ? 'bg-yellow-400'
                      : 'bg-orange-400'
                  }`}
                  style={{ width: `${chunkBarPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5 text-[#6e684a]">
              <Clock className="w-3 h-3" />
              <span>Added {new Date(source.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#6e684a]">
              <RefreshCw className="w-3 h-3" />
              <span>Updated {new Date(source.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Content preview (for text/faq/json) */}
          {source.content && (
            <div className="space-y-1">
              <p className="text-[10px] text-[#6e684a] uppercase tracking-wide">Content preview</p>
              <p className="text-xs text-[#a8a99e] font-mono bg-[#1a1915] p-2 rounded-lg max-h-20 overflow-hidden leading-relaxed">
                {source.content.slice(0, 300)}{source.content.length > 300 ? '…' : ''}
              </p>
            </div>
          )}

          {/* Ref URL */}
          {source.ref && (source.type === 'url' || source.type === 'api') && (
            <div className="flex items-center gap-1.5">
              {source.type === 'url' ? (
                <Globe className="w-3 h-3 text-[#6e684a] shrink-0" />
              ) : (
                <Database className="w-3 h-3 text-[#6e684a] shrink-0" />
              )}
              <a
                href={source.ref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-yellow-400 hover:text-yellow-300 truncate font-mono"
              >
                {source.ref}
              </a>
              <ExternalLink className="w-3 h-3 text-[#6e684a] shrink-0" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add source modal ──────────────────────────────────────────────────────────

function AddSourceModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (s: Omit<KnowledgeSource, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [type, setType] = useState<KnowledgeSourceType>('url');
  const [name, setName] = useState('');
  const [ref, setRef] = useState('');
  const [content, setContent] = useState('');
  const [showAll, setShowAll] = useState(false);

  const visibleTypes = showAll ? SOURCE_TYPES : SOURCE_TYPES.slice(0, 6);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      type,
      name: name.trim(),
      status: 'indexing',
      chunkCount: 0,
      ref: ref.trim(),
      content: content.trim(),
      errorMessage: undefined,
    });
    onClose();
  };

  const canAdd = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-6 max-w-lg w-full space-y-5 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Add Knowledge Source</h3>
          <button onClick={onClose} className="text-[#6e684a] hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source type grid */}
        <div>
          <label className="block text-xs font-bold text-[#8f834a] uppercase tracking-wide mb-2">
            Source Type <span className="text-yellow-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {visibleTypes.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                  type === t.value
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-[#0d0c0a] border-[#2d2813] hover:border-[#3d3823]'
                }`}
              >
                <span className={type === t.value ? 'text-yellow-400' : 'text-[#6e684a]'}>
                  {(() => { const Icon = t.icon; return <Icon size={16} />; })()}
                </span>
                <span className={`text-xs font-semibold ${type === t.value ? 'text-white' : 'text-[#a8a99e]'}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
          {!showAll && SOURCE_TYPES.length > 6 && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-2 text-xs text-[#6e684a] hover:text-white flex items-center gap-1 transition"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              {SOURCE_TYPES.length - 6} more types
            </button>
          )}
        </div>

        {/* Name field */}
        <div>
          <label className="block text-xs font-bold text-[#8f834a] mb-1.5">
            Source Name <span className="text-yellow-400">*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Product Return Policy, FAQ Page"
            className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-yellow-500/50 transition"
            autoFocus
          />
        </div>

        {/* URL / API ref */}
        {(type === 'url' || type === 'api') && (
          <div>
            <label className="block text-xs font-bold text-[#8f834a] mb-1.5">
              {type === 'url' ? 'Website URL' : 'API Endpoint'}
            </label>
            <div className="relative">
              <input
                value={ref}
                onChange={e => setRef(e.target.value)}
                placeholder={type === 'url' ? 'https://yoursite.com/pricing' : 'https://api.yoursite.com/products'}
                className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl pl-9 pr-3 py-2.5 text-white text-sm font-mono outline-none focus:border-yellow-500/50 transition"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e684a]">
                {type === 'url' ? <Globe className="w-4 h-4" /> : <Database className="w-4 h-4" />}
              </div>
            </div>
            {type === 'url' && (
              <p className="mt-1 text-[10px] text-[#5a554a]">
                We'll scrape the page content and index it for your chatbot.
              </p>
            )}
          </div>
        )}

        {/* Content: FAQ */}
        {type === 'faq' && (
          <div>
            <label className="block text-xs font-bold text-[#8f834a] mb-1.5">
              Q&amp;A Pairs <span className="text-[#5a554a] normal-case font-normal">(one per line: Question | Answer)</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={7}
              placeholder={"What are your hours? | We are open Mon–Fri 9am–6pm\nHow much is shipping? | Free over $50, otherwise $5.99\nWhat is your return policy? | 30 days, unused items"}
              className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-xs font-mono outline-none focus:border-yellow-500/50 resize-none transition leading-relaxed"
            />
            <p className="mt-1 text-[10px] text-[#5a554a]">
              Each line becomes a indexed Q&amp;A pair. The chatbot will match customer questions to these answers.
            </p>
          </div>
        )}

        {/* Content: Plain Text */}
        {type === 'text' && (
          <div>
            <label className="block text-xs font-bold text-[#8f834a] mb-1.5">
              Text Content
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={7}
              placeholder={"Paste or type the text you want your chatbot to know. This content will be chunked and indexed so the bot can answer questions about it..."}
              className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-yellow-500/50 resize-none transition leading-relaxed"
            />
          </div>
        )}

        {/* Content: JSON */}
        {type === 'json' && (
          <div>
            <label className="block text-xs font-bold text-[#8f834a] mb-1.5">
              JSON Data
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={7}
              placeholder={'[{"name": "Widget Pro", "price": 29.99, "description": "Our best-selling widget..."}, ...]'}
              className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-xs font-mono outline-none focus:border-yellow-500/50 resize-none transition"
            />
            <p className="mt-1 text-[10px] text-[#5a554a]">
              Each JSON object becomes an indexed record. Customers can ask "Do you have a [product]?" and the bot will look it up.
            </p>
          </div>
        )}

        {/* Database */}
        {type === 'database' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#8f834a] mb-1.5">Connection String</label>
              <input
                value={ref}
                onChange={e => setRef(e.target.value)}
                placeholder="postgresql://user:pass@host:5432/db"
                className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-sm font-mono outline-none focus:border-yellow-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8f834a] mb-1.5">SQL Query</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                placeholder="SELECT name, description, price FROM products WHERE active = true LIMIT 100"
                className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-xs font-mono outline-none focus:border-yellow-500/50 resize-none transition"
              />
            </div>
          </div>
        )}

        {/* PDF / CSV */}
        {(type === 'pdf' || type === 'csv') && (
          <div className="border-2 border-dashed border-[#2d2813] rounded-xl p-6 text-center">
            <p className="mb-2 text-[#6e684a]">{type === 'pdf' ? <FileText size={32} /> : <FileSpreadsheet size={32} />}</p>
            <p className="text-sm text-white font-semibold">
              {type === 'pdf' ? 'Upload PDF' : 'Upload CSV'}
            </p>
            <p className="text-xs text-[#6e684a] mt-1">
              File upload coming soon — paste your content in the text field below for now
            </p>
            {type === 'csv' && (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={5}
                placeholder="name,description,price&#10Widget Pro,Our best widget,29.99&#10Widget Air,Lightweight option,19.99"
                className="mt-3 w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-yellow-500/50 resize-none transition"
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-sm font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Source
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main step ────────────────────────────────────────────────────────────────

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
