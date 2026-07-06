/**
 * storeTypes — all type definitions for the chatbot builder store.
 * Extracted from chatbotBuilderStore.ts to keep the store implementation lean.
 */
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

export {
  type ChatbotDraft,
  type BuilderStepId,
  createDefaultDraft,
  STEP_ORDER,
};
export type {
  GeneralDraft,
  AudienceDraft,
  AIBrainDraft,
  KnowledgeDraft,
  DataConnectionsDraft,
  ToolsDraft,
  GroupsDraft,
  HandoffDraft,
  TestDraft,
};

// ─── Store Interface ───────────────────────────────────────────────────────────

export interface ChatbotBuilderStore {
  // ── State ────────────────────────────────────────────────────────────────
  draft: ChatbotDraft;
  isEditMode: boolean;
  botId: string | null;
  clientToken: string | null;

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
  updateDraft: (data: Partial<ChatbotDraft>) => void;
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
  getProgress: () => number;
  isFirstStep: () => boolean;
  isLastStep: () => boolean;
  getCurrentStepIndex: () => number;
}

export type { ChatbotBuilderStore as ChatbotBuilderStoreType };
