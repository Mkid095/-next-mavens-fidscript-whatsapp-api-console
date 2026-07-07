import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch } from '../../data/hooks/shared/useSearch.js';
import type { SearchHit } from '../../data/api/platform.js';

// Phase 3 — Command-K universal search palette (§8).
// Listens for ⌘K / Ctrl-K globally while open. Rendered once near the app
// shell so it's always available.
interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (hit: SearchHit) => void;
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  customer: { label: 'Customer', color: 'bg-forest-deep' },
  message: { label: 'Message', color: 'bg-yellow-500' },
  campaign: { label: 'Campaign', color: 'bg-amber-600' },
  order: { label: 'Order', color: 'bg-stone-600' },
  knowledge: { label: 'Knowledge', color: 'bg-sky-600' },
  agent: { label: 'AI agent', color: 'bg-purple-600' },
};

export default function CommandPalette({ open, onClose, onSelect }: CommandPaletteProps) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { hits, grouped, loading, error } = useSearch(q);

  // Focus the input on open + reset on close
  useEffect(() => {
    if (open) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const orderedTypes = Object.keys(TYPE_META).filter((k) => grouped[k]?.length);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 p-4 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-stone-200 px-3 py-2">
          <Search size={16} className="text-stone-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customers, messages, orders, knowledge…"
            className="flex-1 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
          />
          <button onClick={onClose} aria-label="Close search" className="text-stone-400 hover:text-stone-700">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {!q.trim() ? (
            <p className="px-2 py-6 text-center text-xs text-stone-400">Type to search across your workspace</p>
          ) : loading ? (
            <p className="px-2 py-6 text-center text-xs text-stone-400">Searching…</p>
          ) : error ? (
            <p className="px-2 py-6 text-center text-xs text-red-600">{error}</p>
          ) : hits.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-stone-400">No results for “{q}”</p>
          ) : (
            orderedTypes.map((type) => {
              const meta = TYPE_META[type];
              return (
                <div key={type} className="mb-2">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                    {meta.label} <span className="ml-1 text-stone-300">({grouped[type].length})</span>
                  </p>
                  <ul>
                    {grouped[type].map((h) => (
                      <li key={`${type}-${h.entityId}`}>
                        <button
                          onClick={() => { onSelect?.(h); onClose(); }}
                          className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-stone-50"
                        >
                          <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${meta.color}`} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-stone-800">{h.body || h.entityId}</span>
                            {h.tags?.length ? (
                              <span className="block truncate text-[10px] text-stone-400">{h.tags.join(' · ')}</span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between border-t border-stone-200 px-3 py-1.5 text-[10px] text-stone-400">
          <span>⏎ Open · Esc Close</span>
          <span>Phase 3 · Universal search</span>
        </div>
      </div>
    </div>
  );
}
