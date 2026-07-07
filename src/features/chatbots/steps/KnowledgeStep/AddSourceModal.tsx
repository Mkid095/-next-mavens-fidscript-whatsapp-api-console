import React, { useState } from 'react';
import {
  Plus,
  X,
  Globe,
  Database,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import type { KnowledgeSource, KnowledgeSourceType } from '../../types';
import { SOURCE_TYPES } from './sourceTypes';

interface AddSourceModalProps {
  onClose: () => void;
  onAdd: (s: Omit<KnowledgeSource, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function AddSourceModal({ onClose, onAdd }: AddSourceModalProps) {
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
              className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-xl px-3 py-2.5 text-white text-xs font-mono outline-none focus:border-yellow-500/50 transition"
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
