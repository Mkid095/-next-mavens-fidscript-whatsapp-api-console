import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';

interface ChatbotBuilderFooterProps {
  canGoNext: boolean;
  publishJob: unknown | null;
  onPublish: () => void;
  onDiscard: () => void;
}

export default function ChatbotBuilderFooter({ canGoNext, publishJob, onPublish, onDiscard }: ChatbotBuilderFooterProps) {
  const draft = useChatbotBuilderStore(s => s.draft);
  const goNext = useChatbotBuilderStore(s => s.goNext);
  const goPrevious = useChatbotBuilderStore(s => s.goPrevious);
  const isFirstStep = useChatbotBuilderStore(s => s.isFirstStep);
  const isLastStep = useChatbotBuilderStore(s => s.isLastStep);

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-[#13120d] border-t border-[#2d2813] px-4 py-3 flex items-center justify-between z-50">
      <button
        onClick={goPrevious}
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
          onClick={onDiscard}
          className="px-4 py-2 text-xs font-semibold text-[#6e684a] hover:text-white transition"
        >
          Cancel
        </button>

        {isLastStep() ? (
          <button
            onClick={onPublish}
            disabled={draft.isSaving || !canGoNext || Boolean(publishJob)}
            className="flex items-center gap-2 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold rounded-xl text-xs transition"
          >
            {draft.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Publish
          </button>
        ) : (
          <button
            onClick={goNext}
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
  );
}
