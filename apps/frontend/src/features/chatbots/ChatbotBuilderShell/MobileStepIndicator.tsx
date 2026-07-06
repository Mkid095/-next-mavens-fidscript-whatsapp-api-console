import { CheckCircle2 } from 'lucide-react';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';
import { BUILDER_STEPS } from '../types';

export default function MobileStepIndicator() {
  const draft = useChatbotBuilderStore(s => s.draft);
  const goToStep = useChatbotBuilderStore(s => s.goToStep);
  const isStepCompleted = useChatbotBuilderStore(s => s.isStepCompleted);

  const currentStepMeta = BUILDER_STEPS.find(s => s.id === draft.currentStep) ?? BUILDER_STEPS[0];

  return (
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
        {currentStepMeta.label}
      </span>
    </div>
  );
}
