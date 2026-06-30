/**
 * ChatbotBuilderStore — Zustand store for the multi-step chatbot builder.
 *
 * Single source of truth for the entire builder state.
 * Handles draft persistence, step navigation, validation, and autosave.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  type ChatbotDraft,
  type BuilderStepId,
  type GeneralDraft,
  type AudienceDraft,
  type AIBrainDraft,
  type KnowledgeDraft,
  type DataConnectionsDraft,
  type ToolsDraft,
  type GroupsDraft,
  type HandoffDraft,
  type TestDraft,
  createDefaultDraft,
  STEP_ORDER,
} from '../types';

// ─── Store Interface ───────────────────────────────────────────────────────────

interface ChatbotBuilderStore {
  // ── State ────────────────────────────────────────────────────────────────
  draft: ChatbotDraft;
  isEditMode: boolean;

  // ── Step Navigation ───────────────────────────────────────────────────────
  goToStep: (step: BuilderStepId) => void;
  goNext: () => void;
  goPrevious: () => void;
  completeStep: (step: BuilderStepId) => void;
  isStepCompleted: (step: BuilderStepId) => boolean;
  canAdvanceFrom: (step: BuilderStepId) => boolean;

  // ── Draft CRUD ─────────────────────────────────────────────────────────────
  initNew: (instanceId?: string) => void;
  initEdit: (draft: ChatbotDraft) => void;
  updateGeneral: (data: Partial<GeneralDraft>) => void;
  updateAudience: (data: Partial<AudienceDraft>) => void;
  updateAIBrain: (data: Partial<AIBrainDraft>) => void;
  updateKnowledge: (data: Partial<KnowledgeDraft>) => void;
  updateDataConnections: (data: Partial<DataConnectionsDraft>) => void;
  updateTools: (data: Partial<ToolsDraft>) => void;
  updateGroups: (data: Partial<GroupsDraft>) => void;
  updateHandoff: (data: Partial<HandoffDraft>) => void;
  updateTest: (data: Partial<TestDraft>) => void;

  // ── Persistence ────────────────────────────────────────────────────────────
  markDirty: () => void;
  markClean: () => void;
  setSaving: (saving: boolean) => void;
  setLastSaved: (at: string) => void;
  setStepError: (step: BuilderStepId, error: string | null) => void;
  reset: () => void;

  // ── Helpers ────────────────────────────────────────────────────────────────
  getProgress: () => number; // 0-100
  isFirstStep: () => boolean;
  isLastStep: () => boolean;
  getCurrentStepIndex: () => number;
}

// ─── Initial State ─────────────────────────────────────────────────────────────

const makeInitialState = (): Pick<ChatbotBuilderStore, 'draft' | 'isEditMode'> => ({
  draft: createDefaultDraft(),
  isEditMode: false,
});

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useChatbotBuilderStore = create<ChatbotBuilderStore>()(
  subscribeWithSelector((set, get) => ({
    // ── Initial ────────────────────────────────────────────────────────────

    ...makeInitialState(),

    initNew: (instanceId = '') =>
      set({
        draft: createDefaultDraft(instanceId),
        isEditMode: false,
      }),

    initEdit: (draft) =>
      set({
        draft: { ...draft, isDirty: false, isSaving: false },
        isEditMode: true,
      }),

    // ── Navigation ─────────────────────────────────────────────────────────

    goToStep: (step) => {
      const { draft } = get();
      // Mark previous step as completed if navigating forward
      const currentIndex = STEP_ORDER.indexOf(draft.currentStep);
      const nextIndex = STEP_ORDER.indexOf(step);
      const completedSteps =
        nextIndex > currentIndex
          ? [...new Set([...draft.completedSteps, draft.currentStep])]
          : draft.completedSteps;
      set({ draft: { ...draft, currentStep: step, completedSteps } });
    },

    goNext: () => {
      const { draft, canAdvanceFrom } = get();
      if (!canAdvanceFrom(draft.currentStep)) return;
      const currentIndex = STEP_ORDER.indexOf(draft.currentStep);
      if (currentIndex < STEP_ORDER.length - 1) {
        const nextStep = STEP_ORDER[currentIndex + 1];
        const completedSteps = [...new Set([...draft.completedSteps, draft.currentStep])];
        set({ draft: { ...draft, currentStep: nextStep, completedSteps } });
      }
    },

    goPrevious: () => {
      const { draft } = get();
      const currentIndex = STEP_ORDER.indexOf(draft.currentStep);
      if (currentIndex > 0) {
        set({ draft: { ...draft, currentStep: STEP_ORDER[currentIndex - 1] } });
      }
    },

    completeStep: (step) => {
      const { draft } = get();
      if (!draft.completedSteps.includes(step)) {
        set({ draft: { ...draft, completedSteps: [...draft.completedSteps, step] } });
      }
    },

    isStepCompleted: (step) => {
      return get().draft.completedSteps.includes(step);
    },

    canAdvanceFrom: (step) => {
      const { draft } = get();
      // Validate required fields per step
      switch (step) {
        case 'general':
          return draft.general.name.trim().length > 0 && draft.instanceId.length > 0;
        case 'audience':
          return true; // audience is optional — "everyone" is valid
        case 'ai-brain':
          return draft.aiBrain.model.length > 0;
        default:
          return true;
      }
    },

    // ── Draft Updates ──────────────────────────────────────────────────────

    updateGeneral: (data) =>
      set((state) => ({
        draft: {
          ...state.draft,
          general: { ...state.draft.general, ...data },
          isDirty: true,
        },
      })),

    updateAudience: (data) =>
      set((state) => ({
        draft: {
          ...state.draft,
          audience: { ...state.draft.audience, ...data },
          isDirty: true,
        },
      })),

    updateAIBrain: (data) =>
      set((state) => ({
        draft: {
          ...state.draft,
          aiBrain: { ...state.draft.aiBrain, ...data },
          isDirty: true,
        },
      })),

    updateKnowledge: (data) =>
      set((state) => ({
        draft: {
          ...state.draft,
          knowledge: { ...state.draft.knowledge, ...data },
          isDirty: true,
        },
      })),

    updateDataConnections: (data) =>
      set((state) => ({
        draft: {
          ...state.draft,
          dataConnections: { ...state.draft.dataConnections, ...data },
          isDirty: true,
        },
      })),

    updateTools: (data) =>
      set((state) => ({
        draft: {
          ...state.draft,
          tools: { ...state.draft.tools, ...data },
          isDirty: true,
        },
      })),

    updateGroups: (data) =>
      set((state) => ({
        draft: {
          ...state.draft,
          groups: { ...state.draft.groups, ...data },
          isDirty: true,
        },
      })),

    updateHandoff: (data) =>
      set((state) => ({
        draft: {
          ...state.draft,
          handoff: { ...state.draft.handoff, ...data },
          isDirty: true,
        },
      })),

    updateTest: (data) =>
      set((state) => ({
        draft: {
          ...state.draft,
          test: { ...state.draft.test, ...data },
          isDirty: true,
        },
      })),

    // ── Persistence ───────────────────────────────────────────────────────

    markDirty: () =>
      set((state) => ({ draft: { ...state.draft, isDirty: true } })),

    markClean: () =>
      set((state) => ({ draft: { ...state.draft, isDirty: false } })),

    setSaving: (saving) =>
      set((state) => ({ draft: { ...state.draft, isSaving: saving } })),

    setLastSaved: (at) =>
      set((state) => ({ draft: { ...state.draft, lastSavedAt: at } })),

    setStepError: (step, error) =>
      set((state) => ({
        draft: {
          ...state.draft,
          errors: error
            ? { ...state.draft.errors, [step]: error }
            : { ...state.draft.errors, [step]: undefined },
        },
      })),

    reset: () => set(makeInitialState()),

    // ── Helpers ───────────────────────────────────────────────────────────

    getProgress: () => {
      const { draft } = get();
      const completed = draft.completedSteps.length;
      return Math.round((completed / STEP_ORDER.length) * 100);
    },

    isFirstStep: () => {
      return get().draft.currentStep === STEP_ORDER[0];
    },

    isLastStep: () => {
      const { draft } = get();
      return draft.currentStep === STEP_ORDER[STEP_ORDER.length - 1];
    },

    getCurrentStepIndex: () => {
      return STEP_ORDER.indexOf(get().draft.currentStep);
    },
  }))
);

// ─── Autosave Hook ─────────────────────────────────────────────────────────────

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleAutosave(clientToken: string, delayMs = 2000) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    const { draft, setSaving, setLastSaved, markClean } = useChatbotBuilderStore.getState();
    if (!draft.isDirty) return;

    setSaving(true);

    // Always persist to localStorage as backup first
    try {
      localStorage.setItem(
        `chatbot_draft_${draft.id ?? 'new'}`,
        JSON.stringify(draft)
      );
    } catch (_) { /* ignore */ }

    // Attempt to save to server
    try {
      const draftId = draft.id ? `draft_${draft.id}` : `draft_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await fetch(`/api/platform/chatbot-drafts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: draftId,
          draft_json: JSON.stringify(draft),
          last_step: draft.currentStep,
        }),
      });
    } catch (_) { /* fall back to localStorage only */ }

    setSaving(false);
    setLastSaved(new Date().toISOString());
    markClean();
  }, delayMs);
}

// ─── Restore Draft Helper ─────────────────────────────────────────────────────

export function restoreDraft(botId?: string): ChatbotDraft | null {
  try {
    const key = `chatbot_draft_${botId ?? 'new'}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as ChatbotDraft;
    }
  } catch (_) { /* ignore */ }
  return null;
}

export function clearDraft(botId?: string) {
  try {
    localStorage.removeItem(`chatbot_draft_${botId ?? 'new'}`);
  } catch (_) { /* ignore */ }
}
