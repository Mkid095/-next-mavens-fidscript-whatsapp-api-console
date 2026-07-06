import { useState } from 'react';
import { Plus, Tag, X } from 'lucide-react';
import { useTags } from '../../data/hooks/useTags.js';

// Phase 3 — tags manager for one customer (§6.1 customer_tags + §19 drawer).
// Optimistic add/remove via the useTags hook.
export default function TagsManager({ customerId }: { customerId: string }) {
  const { tags, add, remove } = useTags(customerId);
  const [draft, setDraft] = useState('');

  const onAdd = async () => {
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    await add(t);
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        <Tag size={12} /> Tags
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tags.length === 0 ? (
          <span className="text-[11px] text-stone-400">No tags yet</span>
        ) : (
          tags.map((t) => (
            <span key={t.id} className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700">
              {t.tag}
              <button
                aria-label={`Remove tag ${t.tag}`}
                onClick={() => remove(t.tag)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={10} />
              </button>
            </span>
          ))
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onAdd(); }}
          placeholder="Add tag…"
          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep"
        />
        <button
          onClick={onAdd}
          disabled={!draft.trim()}
          className="flex items-center gap-1 rounded-lg bg-forest-deep px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
        >
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}
