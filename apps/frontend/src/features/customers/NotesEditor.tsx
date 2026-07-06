import { useState } from 'react';
import { NotebookPen, Trash2 } from 'lucide-react';
import { useNotes } from '../../data/hooks/useNotes.js';

// Phase 3 — internal-only customer notes (§6.1 customer_notes).
// Author + created_at come from the server. Optimistic prepend.
export default function NotesEditor({ customerId }: { customerId: string }) {
  const { notes, add, remove } = useNotes(customerId);
  const [draft, setDraft] = useState('');

  const onAdd = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    await add(body);
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        <NotebookPen size={12} /> Internal notes
      </div>
      <div className="mb-2 space-y-1.5">
        {notes.length === 0 ? (
          <p className="text-[11px] text-stone-400">No notes yet</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="group rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs text-stone-700">
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap break-words">{n.body}</p>
                <button
                  aria-label="Delete note"
                  onClick={() => remove(n.id)}
                  className="shrink-0 text-stone-300 hover:text-red-600"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <p className="mt-1 text-[10px] text-stone-400">
                {n.author_name ?? '—'} · {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Add a note (visible to your team only)…"
        rows={2}
        className="w-full resize-none rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs outline-none focus:border-forest-deep"
      />
      <button
        onClick={onAdd}
        disabled={!draft.trim()}
        className="mt-1.5 w-full rounded-lg bg-forest-deep px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
      >
        Add note
      </button>
    </div>
  );
}
