import { useEffect } from 'react';

export function useKeyboardShortcuts(onSave: () => void, onPublish: () => void, isLastStep: () => boolean) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        isLastStep() ? onPublish() : onSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLastStep, onSave, onPublish]);
}
