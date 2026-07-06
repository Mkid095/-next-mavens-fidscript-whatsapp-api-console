import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import type { BuilderStepId } from '../types';
import { BUILDER_STEPS } from '../types';

export function useUnsavedChangesProtection(onEscapeWhenDirty: () => void) {
  const navigate = useNavigate();
  const draft = useChatbotBuilderStore(s => s.draft);
  const isNavigatingRef = useRef(false);

  // ── Unsaved changes protection (beforeunload) ──────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (draft.isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [draft.isDirty]);

  // ── Deep linking: sync URL param → currentStep ───────────────────────────
  useEffect(() => {
    if (isNavigatingRef.current) return;
    const step = new URLSearchParams(window.location.search).get('step') as BuilderStepId | null;
    if (step && BUILDER_STEPS.some(s => s.id === step) && step !== draft.currentStep) {
      isNavigatingRef.current = true;
      useChatbotBuilderStore.getState().goToStep(step);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update URL when step changes ─────────────────────────────────────────
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('step', draft.currentStep);
    window.history.replaceState({}, '', url.toString());
  }, [draft.currentStep]);

  // ── Keyboard: Escape to leave ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (draft.isDirty) onEscapeWhenDirty();
        else navigate('/client/chatbots');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [draft.isDirty, onEscapeWhenDirty, navigate]);
}
