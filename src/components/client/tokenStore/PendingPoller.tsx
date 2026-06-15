import { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { paymentsApi } from '../../../services/api';

interface PendingPollerProps {
  reference: string;
  checkoutId: string;
  onStatusChange: (status: string) => void;
}

const MAX_SECONDS = 120;

export default function PendingPoller({
  reference, checkoutId, onStatusChange,
}: PendingPollerProps) {
  const [state, setState] = useState<'waiting' | 'timeout' | 'done'>('waiting');
  const [elapsed, setElapsed] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setState('waiting');
    setElapsed(0);

    let pollInterval: ReturnType<typeof setInterval>;
    let tickInterval: ReturnType<typeof setInterval>;
    let timeout: ReturnType<typeof setTimeout>;

    // Tick every second for smooth elapsed counter
    tickInterval = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);

    const poll = async () => {
      if (doneRef.current) return;
      try {
        const res = await paymentsApi.getPaymentStatus(checkoutId || reference);
        if (doneRef.current) return;
        if (res.success && res.data) {
          if (res.data.status === 'completed') {
            doneRef.current = true;
            setState('done');
            clearInterval(tickInterval);
            clearTimeout(timeout);
            onStatusChange('completed');
            return;
          }
          if (res.data.status === 'failed') {
            doneRef.current = true;
            setState('done');
            clearInterval(tickInterval);
            clearTimeout(timeout);
            onStatusChange('failed');
            return;
          }
        }
      } catch {}
    };

    pollInterval = setInterval(poll, 5000);
    // Immediate first poll
    poll();

    timeout = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      setState('timeout');
      clearInterval(tickInterval);
      clearInterval(pollInterval);
      onStatusChange('timeout');
    }, MAX_SECONDS * 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
      clearTimeout(timeout);
    };
  }, [checkoutId, reference, onStatusChange]);

  if (state === 'timeout') {
    return (
      <div className="p-3 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        Payment may have failed — check your M-Pesa app. Tokens will be added automatically once confirmed.
      </div>
    );
  }

  if (state === 'done') return null;

  return (
    <div className="p-3 rounded-xl text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
      Waiting for M-Pesa confirmation... ({elapsed}s)
    </div>
  );
}
