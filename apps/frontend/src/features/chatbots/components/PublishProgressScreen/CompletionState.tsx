import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import type { PublishJob } from './PublishProgressScreen';

export function CompletionState({
  job,
}: {
  job: PublishJob;
}) {
  const isFailed = job.status === 'failed';
  const isDone = job.status === 'done';

  if (isFailed) {
    return (
      <div className="w-10 h-10 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="w-10 h-10 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center">
        <CheckCircle2 className="w-5 h-5 text-green-400" />
      </div>
    );
  }

  return null;
}
