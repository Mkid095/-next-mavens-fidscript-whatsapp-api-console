import { ArrowLeft, Bot, CheckCircle2, Circle, Loader2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import { BUILDER_STEPS } from '../types';

interface BuilderSidebarProps {
  isEditMode: boolean;
  onSave: () => void;
  onRequestLeave: () => void;
}

export default function BuilderSidebar({ isEditMode, onSave, onRequestLeave }: BuilderSidebarProps) {
  const navigate = useNavigate();
  const draft = useChatbotBuilderStore(s => s.draft);
  const isStepCompleted = useChatbotBuilderStore(s => s.isStepCompleted);
  const goToStep = useChatbotBuilderStore(s => s.goToStep);
  const getCurrentStepIndex = useChatbotBuilderStore(s => s.getCurrentStepIndex);
  const getProgress = useChatbotBuilderStore(s => s.getProgress);

  const currentIndex = getCurrentStepIndex();
  const progress = getProgress();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-[#2d2813] bg-[#13120d] px-4 py-6 shrink-0">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onRequestLeave}
          className="flex items-center gap-2 text-[#8f834a] hover:text-white text-xs transition mb-2"
        >
          <ArrowLeft className="w-3 h-3" />
          All Chatbots
        </button>
        <h2 className="text-white font-bold text-sm flex items-center gap-2">
          <Bot className="w-4 h-4 text-yellow-400" />
          {isEditMode ? 'Edit Chatbot' : 'Create Chatbot'}
        </h2>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-1.5 bg-[#1f1d0b] rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-[#6e684a] mt-1">{progress}% complete</p>
      </div>

      {/* Step list */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {BUILDER_STEPS.map((step, idx) => {
          const isActive = step.id === draft.currentStep;
          const isDone = isStepCompleted(step.id);
          const isAccessible = idx <= currentIndex + 1 || isDone;

          return (
            <button
              key={step.id}
              onClick={() => isAccessible && goToStep(step.id)}
              disabled={!isAccessible}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all text-left disabled:opacity-40 ${
                isActive
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  : isDone
                  ? 'text-[#6e684a] hover:text-white'
                  : 'text-[#6e684a] hover:text-white'
              }`}
            >
              <span className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : isActive ? (
                  <Circle className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                ) : (
                  <Circle className="w-4 h-4 text-[#3d3823]" />
                )}
              </span>
              <div className="min-w-0">
                <p className={`font-semibold truncate ${isActive ? 'text-white' : ''}`}>
                  {idx + 1}. {step.label}
                </p>
                {isActive && (
                  <p className="text-[10px] text-[#6e684a] truncate">{step.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Save button */}
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
    </aside>
  );
}
