import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import { BUILDER_STEPS } from '../types';

interface ChatbotBuilderContentProps {
  StepComponent: React.ComponentType;
}

export default function ChatbotBuilderContent({ StepComponent }: ChatbotBuilderContentProps) {
  const draft = useChatbotBuilderStore(s => s.draft);
  const getCurrentStepIndex = useChatbotBuilderStore(s => s.getCurrentStepIndex);

  const currentStepMeta = BUILDER_STEPS.find(s => s.id === draft.currentStep) ?? BUILDER_STEPS[0];
  const currentIndex = getCurrentStepIndex();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[#6e684a] text-xs mb-2">
            <span className="font-mono">Step {currentIndex + 1} of {BUILDER_STEPS.length}</span>
            <span>·</span>
            <span>{currentStepMeta.label}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{currentStepMeta.label}</h1>
          <p className="text-[#8f834a] text-sm mt-1">{currentStepMeta.description}</p>
        </div>

        {/* Step content */}
        <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-6 mb-24">
          <StepComponent />
        </div>
      </div>
    </main>
  );
}
