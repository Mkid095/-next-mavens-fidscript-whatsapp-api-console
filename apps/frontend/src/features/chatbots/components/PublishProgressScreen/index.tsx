/**
 * PublishProgressScreen
 *
 * Full-screen progress overlay shown during chatbot publish.
 * Polling is handled externally — this component just renders job state.
 */
import React from 'react';
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ProgressIndicator } from './ProgressIndicator';
import { LogStream } from './LogStream';
import { CompletionState } from './CompletionState';

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
            <CompletionState job={job} />
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
        <ProgressIndicator currentStep={job.current_step} jobStatus={job.status} />

        {/* Error message */}
        <LogStream job={job} />

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
