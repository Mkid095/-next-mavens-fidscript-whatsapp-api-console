import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Toast {
  text: string;
  type: 'success' | 'warn';
}

interface Props {
  error: string | null;
  toast: Toast | null;
  onErrorClose: () => void;
  onToastClose: () => void;
}

export default function NotificationBars({ error, toast, onErrorClose, onToastClose }: Props) {
  return (
    <>
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border-b border-red-800/50 text-red-400 text-xs shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={onErrorClose} className="text-red-500 hover:text-red-300">✕</button>
        </div>
      )}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-md border text-xs ${
          toast.type === 'warn' ? 'bg-amber-900/30 border-amber-700 text-amber-400' : 'bg-green-900/30 border-green-700 text-green-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {toast.text}
          <button onClick={onToastClose} className="ml-1 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}
    </>
  );
}
