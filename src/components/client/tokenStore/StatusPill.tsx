import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface StatusPillProps {
  status: string;
}

export default function StatusPill({ status }: StatusPillProps) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
      <CheckCircle className="w-2.5 h-2.5" /> Completed
    </span>
  );
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
      <XCircle className="w-2.5 h-2.5" /> Failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">
      <Clock className="w-2.5 h-2.5" /> {status}
    </span>
  );
}
