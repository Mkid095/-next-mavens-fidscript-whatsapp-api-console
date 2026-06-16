import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from 'react';
import CommandPalette from './CommandPalette.js';

// Global ⌘K / Ctrl-K universal search.
// Mount <CommandKProvider> ONCE at the app shell. It owns the palette open-state
// + the global keyboard shortcut, and exposes openPalette() via context so any
// chrome element (sidebar button, mobile nav) can trigger it without lifting
// state through props. Previously the trigger button was a stray flex child of
// the root row — it floated in the right margin of every page. Centralizing the
// palette here lets the triggers live where they belong (the nav).

interface CommandKContextValue {
  openPalette: () => void;
}

const CommandKContext = createContext<CommandKContextValue>({ openPalette: () => {} });

export function useCommandK(): CommandKContextValue {
  return useContext(CommandKContext);
}

export function CommandKProvider({ children }: { children: ReactNode }) {
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

  const openPalette = useCallback(() => setOpen(true), []);

  return (
    <CommandKContext.Provider value={{ openPalette }}>
      {children}
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </CommandKContext.Provider>
  );
}
