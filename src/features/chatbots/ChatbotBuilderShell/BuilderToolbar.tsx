import React from 'react';
import { Save, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import type { PublishJob } from '../types';

interface BuilderToolbarProps {
  isEditMode: boolean;
  onSave: () => void;
  onPublish: () => void;
  onGoNext: () => void;
  onGoPrevious: () => void;
  canGoNext: boolean;
  publishJob: PublishJob | null;
  publishError: string | null;
}

export default function BuilderToolbar({
  isEditMode,
  onSave,
  onPublish,
  onGoNext,
  onGoPrevious,
  canGoNext,
  publishJob,
  publishError,
}: BuilderToolbarProps) {
  const navigate = useNavigate();
  const draft = useChatbotBuilderStore(s => s.draft);
  const isFirstStep = useChatbotBuilderStore(s => s.isFirstStep);
  const isLastStep = useChatbotBuilderStore(s => s.isLastStep);
  const clearDraft = useChatbotBuilderStore(s => s.reset);
  const botId = useChatbotBuilderStore(s => s.botId);

  return (
    <>
      {/* ── Sidebar Save Button ─────────────────────────────────────── */}
      <div className="mt-4 pt-4 border-t border-[#2d2813]">
        <button
          onClick={onSave}
          disabled={draft.isSaving || !draft.general.name.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold rounded-xl text-xs transition"
        >
          {draft.isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEditMode ? 'Save Changes' : 'Create Chatbot'}
        </button>
        {draft.lastSavedAt && (
          <p className="text-[10px] text-[#6e684a] text-center mt-1.5">
            Saved {new Date(draft.lastSavedAt).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* ── Bottom Navigation Bar ─────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-[#13120d] border-t border-[#2d2813] px-4 py-3 flex items-center justify-between z-50">
        <button
          onClick={onGoPrevious}
          disabled={isFirstStep()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#8f834a] hover:text-white disabled:opacity-30 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {draft.isDirty && !draft.isSaving && (
          <p className="text-[10px] text-[#6e684a] hidden sm:block">
            Unsaved changes
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (draft.isDirty) {
                const confirmed = window.confirm('Discard unsaved changes?');
                if (!confirmed) return;
              }
              clearDraft();
              navigate('/client/chatbots');
            }}
            className="px-4 py-2 text-xs font-semibold text-[#6e684a] hover:text-white transition"
          >
            {isEditMode ? 'Cancel' : 'Discard'}
          </button>

          {isLastStep() ? (
            <button
              onClick={onPublish}
              disabled={draft.isSaving || !canGoNext || Boolean(publishJob)}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold rounded-xl text-xs transition"
            >
              {draft.isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Publish
            </button>
          ) : (
            <button
              onClick={onGoNext}
              disabled={!canGoNext}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold rounded-xl text-xs transition"
              title={!canGoNext ? 'Fill in required fields to continue' : ''}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
