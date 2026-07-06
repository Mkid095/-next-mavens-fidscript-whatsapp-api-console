import { useEffect, useRef, useState } from 'react';
import {
  useChatbotBuilderStore,
  restoreDraft,
} from '../store/chatbotBuilderStore';
import { BUILDER_STEPS, type BuilderStepId } from '../types';
import { fetchApi } from '../../../services/api';
import type { Instance } from '../../../services/api';
import { buildInitEditData } from './buildInitEditData';

interface UseBotLoaderOptions {
  botId?: string;
  isEditMode: boolean;
  clientToken: string;
  instances: Instance[];
  initNew: (instanceId: string) => void;
  initEdit: (data: ReturnType<typeof useChatbotBuilderStore.getState>['draft']) => void;
  goToStep: (step: BuilderStepId) => void;
}

export function useBotLoader({ botId, isEditMode, clientToken, instances, initNew, initEdit, goToStep }: UseBotLoaderOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadedBotIdRef = useRef<string | null>(null);

  // Expose botId + clientToken to all step components via the store
  useEffect(() => {
    useChatbotBuilderStore.setState({ botId: botId ?? null, clientToken });
  }, [botId, clientToken]);

  // Migrate old drafts (pre-5-step builder)
  useEffect(() => {
    const validIds = new Set(BUILDER_STEPS.map(s => s.id));
    if (!validIds.has(useChatbotBuilderStore.getState().draft.currentStep)) {
      useChatbotBuilderStore.setState((s) => ({
        draft: { ...s.draft, currentStep: 'setup' as BuilderStepId, completedSteps: [] },
      }));
    }
  }, []);

  const draft = useChatbotBuilderStore(s => s.draft);

  // ── Load existing bot or restore draft ──────────────────────────────────
  useEffect(() => {
    if (loadedBotIdRef.current === botId) return;

    const loadBot = async () => {
      if (isEditMode && botId) {
        const restored = restoreDraft(botId);
        if (restored) {
          loadedBotIdRef.current = botId;
          initEdit(restored);
          return;
        }

        setIsLoading(true);
        setLoadError(null);
        try {
          const res = await fetchApi(`/api/platform/chatbots/${botId}`, {
            headers: { Authorization: `Bearer ${clientToken}` },
          }) as { success: boolean; data: Record<string, unknown>; status?: number };

          if (res.success && res.data) {
            loadedBotIdRef.current = botId;
            initEdit(buildInitEditData(botId, res.data));
          } else {
            loadedBotIdRef.current = null;
            const errMsg = (res as { status?: number }).status === 401
              ? 'Your session has expired — please refresh the page'
              : 'Failed to load chatbot';
            setLoadError(errMsg);
          }
        } catch (err) {
          setLoadError(String(err));
        } finally {
          setIsLoading(false);
        }
      } else {
        const restored = restoreDraft();
        if (restored) initEdit(restored);
        else initNew(instances[0]?.id ?? '');
      }
    };

    loadBot();
  }, [botId, isEditMode, clientToken, initNew, initEdit, instances]);

  // ── Deep linking: sync URL param → currentStep ───────────────────────────
  const isNavigatingRef = useRef(false);
  useEffect(() => {
    if (isNavigatingRef.current) return;
    const step = new URLSearchParams(window.location.search).get('step') as BuilderStepId | null;
    if (step && BUILDER_STEPS.some(s => s.id === step) && step !== draft.currentStep) {
      isNavigatingRef.current = true;
      goToStep(step);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoading, loadError };
}
