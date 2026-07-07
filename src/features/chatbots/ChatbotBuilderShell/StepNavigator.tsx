import React from 'react';
import { ArrowLeft, CheckCircle2, Circle, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BUILDER_STEPS, type BuilderStepId } from '../types';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';

interface StepNavigatorProps {
  isEditMode: boolean;
}

export default function StepNavigator({ isEditMode }: StepNavigatorProps) {
  const navigate = useNavigate();
  const draft = useChatbotBuilderStore(s => s.draft);
  const goToStep = useChatbotBuilderStore(s => s.goToStep);
  const isStepCompleted = useChatbotBuilderStore(s => s.isStepCompleted);
  const getCurrentStepIndex = useChatbotBuilderStore(s => s.getCurrentStepIndex);
  const getProgress = useChatbotBuilderStore(s => s.getProgress);
  const setShowLeaveConfirm = useChatbotBuilderStore(s => (s as unknown as { setShowLeaveConfirm?: (v: boolean) => void }).setShowLeaveConfirm);

  const currentIndex = getCurrentStepIndex();
  const progress = getProgress();

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#2d2813] bg-[#13120d] px-4 py-6 shrink-0">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (draft.isDirty) {
                if (setShowLeaveConfirm) setShowLeaveConfirm(true);
              } else {
                navigate('/client/chatbots');
              }
            }}
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
      </aside>

      {/* ── Mobile Step Indicator ─────────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-3 border-b border-[#2d2813] bg-[#13120d] overflow-x-auto">
        {BUILDER_STEPS.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => goToStep(step.id)}
            className={`shrink-0 w-6 h-6 rounded-full text-[10px] font-bold transition ${
              step.id === draft.currentStep
                ? 'bg-yellow-400 text-black'
                : isStepCompleted(step.id)
                ? 'bg-green-500 text-white'
                : 'bg-[#2d2813] text-[#6e684a]'
            }`}
            title={step.label}
          >
            {isStepCompleted(step.id) ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-[#6e684a] shrink-0">
          {BUILDER_STEPS.find(s => s.id === draft.currentStep)?.label}
        </span>
      </div>
    </>
  );
}
