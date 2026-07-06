import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { PublishJob } from './PublishProgressScreen';

const PIPELINE_STEPS = [
  { key: 'validate',          label: 'Validating configuration'      },
  { key: 'save-config',       label: 'Saving chatbot configuration'   },
  { key: 'build-prompt',      label: 'Building compiled system prompt' },
  { key: 'index-knowledge',   label: 'Indexing knowledge sources'     },
  { key: 'compile-tools',     label: 'Compiling tools'               },
  { key: 'save-version',       label: 'Saving version snapshot'        },
  { key: 'enable-triggers',    label: 'Activating triggers'           },
  { key: 'complete',          label: 'Complete'                        },
];

function getStepIndex(currentStep: string | null): number {
  if (!currentStep) return -1;
  return PIPELINE_STEPS.findIndex(s => s.key === currentStep);
}

export function ProgressIndicator({
  currentStep,
  jobStatus,
}: {
  currentStep: string | null;
  jobStatus: PublishJob['status'];
}) {
  const currentIdx = getStepIndex(currentStep);

  return (
    <div className="px-6 py-4 space-y-0.5">
      {PIPELINE_STEPS.map((step, i) => (
        <StepRow
          key={step.key}
          step={step}
          index={i}
          currentStep={currentStep}
          jobStatus={jobStatus}
          currentIdx={currentIdx}
        />
      ))}
    </div>
  );
}

function StepRow({
  step,
  index,
  currentStep,
  jobStatus,
  currentIdx,
}: {
  step: { key: string; label: string };
  index: number;
  currentStep: string | null;
  jobStatus: PublishJob['status'];
  currentIdx: number;
}) {
  const isCurrent = index === currentIdx;
  const isPast = index < currentIdx;
  const isFuture = index > currentIdx;

  let icon: React.ReactNode;
  let textColor: string;

  if (jobStatus === 'failed') {
    icon = <XCircle className="w-4 h-4 text-red-400" />;
    textColor = 'text-red-400';
  } else if (jobStatus === 'done') {
    icon = <CheckCircle2 className="w-4 h-4 text-green-400" />;
    textColor = 'text-white';
  } else if (isCurrent) {
    icon = <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
    textColor = 'text-white';
  } else if (isPast) {
    icon = <CheckCircle2 className="w-4 h-4 text-green-400" />;
    textColor = 'text-[#6e684a]';
  } else {
    icon = <span className="w-4 h-4 rounded-full border border-[#2d2813]" />;
    textColor = 'text-[#5a554a]';
  }

  return (
    <div className={`flex items-center gap-3 py-2 ${isCurrent ? 'scale-[1.01]' : ''}`}>
      <div className={`shrink-0 ${isCurrent ? 'animate-pulse' : ''}`}>{icon}</div>
      <span className={`text-sm ${textColor} ${isCurrent ? 'font-semibold' : ''}`}>
        {step.label}
      </span>
      {isCurrent && jobStatus !== 'failed' && (
        <span className="ml-auto text-xs text-yellow-400 animate-pulse">in progress…</span>
      )}
    </div>
  );
}
