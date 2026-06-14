import React from 'react';
import { X } from 'lucide-react';

interface SendingErrorBannerProps {
  error: string;
  onClear: () => void;
}

export default function SendingErrorBanner({ error, onClear }: SendingErrorBannerProps) {
  return (
    <div className="px-4 py-1.5 bg-red-50 border-t border-red-100 flex items-center gap-2 shrink-0">
      <span className="text-[10px] text-red-600">{error}</span>
      <button onClick={onClear}><X className="w-3 h-3 text-red-400" /></button>
    </div>
  );
}
