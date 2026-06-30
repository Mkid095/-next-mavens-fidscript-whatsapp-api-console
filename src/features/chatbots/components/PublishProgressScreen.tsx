/**
 * PublishProgressScreen
 *
 * Full-screen progress overlay shown during chatbot publish.
 * Polling is handled externally — this component just renders job state.
 */
import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

export interface PublishJob {
  id: string;
  status: 'pending' | 'building' | 'indexing' | 'compiling' | 'activating' | 'done' | 'failed';
  progress: number;
  current_step: string | null;
  message: string | null;
  error: string | null;
  result_json: string | null;
  created_at: string;
  updated_at: string;
}

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
  const idx = PIPELINE_STEPS.findIndex(s => s.key === currentStep);
  return idx;
}

function StepRow({ step, index, currentStep, jobStatus }: {
  step: { key: string; label: string };
  index: number;
  currentStep: string | null;
  jobStatus: PublishJob['status'];
}) {
  const currentIdx = getStepIndex(currentStep);
  const isCurrent = index === currentIdx;
  const isPast = index < currentIdx;
  const isFuture = index > currentIdx;

  let icon: React.ReactNode;
  let iconColor: string;
  let textColor: string;

  if (jobStatus === 'failed') {
    icon = <XCircle className="w-4 h-4 text-red-400" />;
    iconColor = 'text-red-400';
    textColor = 'text-red-400';
  } else if (jobStatus === 'done') {
    icon = <CheckCircle2 className="w-4 h-4 text-green-400" />;
    iconColor = 'text-green-400';
    textColor = 'text-white';
  } else if (isCurrent) {
    icon = <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
    iconColor = 'text-yellow-400';
    textColor = 'text-white';
  } else if (isPast) {
    icon = <CheckCircle2 className="w-4 h-4 text-green-400" />;
    iconColor = 'text-green-400';
    textColor = 'text-[#6e684a]';
  } else {
    icon = <span className="w-4 h-4 rounded-full border border-[#2d2813]" />;
    iconColor = 'text-[#2d2813]';
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

export default function PublishProgressScreen({
  job,
  onClose,
  onViewChatbot,
  onRetry,
}: {
  job: PublishJob;
  onClose: () => void;
  onViewChatbot: () => void;
  onRetry?: () => void;
}) {
  const isFailed = job.status === 'failed';
  const isDone = job.status === 'done';
  const isActive = !isFailed && !isDone;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#2d2813]">
          <div className="flex items-center gap-3">
            {isFailed ? (
              <div className="w-10 h-10 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            ) : isDone ? (
              <div className="w-10 h-10 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
              </div>
            )}
            <div>
              <p className="font-bold text-white text-base">
                {isFailed ? 'Publish Failed' : isDone ? 'Chatbot Published!' : 'Publishing…'}
              </p>
              <p className="text-xs text-[#6e684a] mt-0.5">
                {job.message ?? (isDone ? 'Your chatbot is now live.' : 'Please wait')}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#6e684a]">
              {isFailed ? 'Failed' : isDone ? 'Complete' : `${job.progress}%`}
            </span>
            {job.current_step && !isFailed && !isDone && (
              <span className="text-[#6e684a] capitalize">{job.current_step.replace('-', ' ')}</span>
            )}
          </div>
          <div className="h-2 bg-[#2d2813] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFailed ? 'bg-red-400' : isDone ? 'bg-green-400' : 'bg-yellow-400'
              }`}
              style={{ width: `${isFailed ? 0 : job.progress}%` }}
            />
          </div>
        </div>

        {/* Step list */}
        <div className="px-6 pb-4 space-y-0.5">
          {PIPELINE_STEPS.map((step, i) => (
            <StepRow
              key={step.key}
              step={step}
              index={i}
              currentStep={job.current_step}
              jobStatus={job.status}
            />
          ))}
        </div>

        {/* Error message */}
        {isFailed && job.error && (
          <div className="mx-6 mb-4 p-3 bg-red-400/5 border border-red-400/10 rounded-xl">
            <p className="text-xs text-red-400 font-semibold mb-1">Error</p>
            <p className="text-xs text-red-300/70">{job.error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-sm font-semibold transition"
          >
            Close
          </button>

          {isFailed && onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}

          {isDone && (
            <button
              onClick={onViewChatbot}
              className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-black rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              View Chatbot
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
