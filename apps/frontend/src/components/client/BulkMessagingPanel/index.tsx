import { useState } from 'react';
import { Zap, Clock } from 'lucide-react';
import type { Instance, Contact } from '../../../services/api';
import BulkMessagingForm from './BulkMessagingForm.js';
import BulkMessagingPreview from './BulkMessagingPreview.js';

interface BulkMessagingPanelProps {
  instances: Instance[];
  savedContacts: Contact[];
  clientToken?: string;
  onTokenDeduct?: (n: number) => void;
  onClose?: () => void;
}

type Step = 'create' | 'history';

/** Thin shell — tab switcher only, delegates all state to child panels. */
export default function BulkMessagingPanel({ instances, savedContacts, onTokenDeduct }: BulkMessagingPanelProps) {
  const [step, setStep] = useState<Step>('create');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-[#2d2813] shrink-0">
        <div className="flex items-center gap-1 p-1 bg-[#181711] border border-[#2d2813] rounded-xl">
          <button
            onClick={() => setStep('create')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${step === 'create' ? 'bg-[#eab308] text-[#181711] font-semibold' : 'text-[#6e684a] hover:text-[#a8a99e]'}`}
          >
            <Zap className="w-3.5 h-3.5" /> Create
          </button>
          <button
            onClick={() => setStep('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${step === 'history' ? 'bg-[#eab308] text-[#181711] font-semibold' : 'text-[#6e684a] hover:text-[#a8a99e]'}`}
          >
            <Clock className="w-3.5 h-3.5" /> History
          </button>
        </div>
      </div>

      {step === 'create'
        ? <BulkMessagingForm instances={instances} savedContacts={savedContacts} onTokenDeduct={onTokenDeduct} />
        : <BulkMessagingPreview />
      }
    </div>
  );
}
