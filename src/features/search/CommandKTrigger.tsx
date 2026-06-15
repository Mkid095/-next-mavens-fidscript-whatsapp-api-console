import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import CommandPalette from './CommandPalette.js';

// Phase 3 — global ⌘K / Ctrl-K listener + button trigger.
// Drop <CommandKTrigger /> once in the app shell. It opens the CommandPalette
// modal which dispatches search calls and returns the selected hit.
export default function CommandKTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-500 hover:border-forest-deep hover:text-forest-deep"
        aria-label="Open universal search (⌘K)"
      >
        <Search size={12} /> Search…
        <kbd className="ml-1 rounded border border-stone-200 bg-white px-1 text-[10px] text-stone-400">⌘K</kbd>
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}
