import { Zap, SendHorizontal } from 'lucide-react';
import type { Instance } from '../../../services/api';

interface BulkMessagingFormFooterProps {
  recipientCount: number;
  totalCost: number;
  messageLength: number;
  creating: boolean;
  scheduledAt: string;
  selectedInstance: string;
  instances: Instance[];
  onCreate: () => void;
  disabled: boolean;
}

export default function BulkMessagingFormFooter({
  recipientCount, totalCost, messageLength, creating, scheduledAt,
  selectedInstance, instances, onCreate, disabled,
}: BulkMessagingFormFooterProps) {
  const segCount = messageLength > 1600 ? 3 : messageLength > 400 ? 2 : 1;

  return (
    <div className="sticky bottom-0 bg-[#1a1915] border-t border-[#2d2813] -mx-3 px-3 py-2.5 flex items-center gap-2">
      <div className="flex-1 text-[10px] text-[#6e684a]">
        <p><span className="font-bold text-[#eab308]">{recipientCount}</span> recipient{recipientCount === 1 ? '' : 's'}</p>
        <p>
          <span className="font-bold text-[#eab308]">{totalCost}</span> token{totalCost === 1 ? '' : 's'}
          {recipientCount > 0 && <span className="text-[#5a554a]"> (~{segCount}×{recipientCount})</span>}
        </p>
      </div>
      {selectedInstance && (
        <div className="flex items-center gap-1.5 text-[10px]">
          {(() => {
            const inst = instances.find(i => i.name === selectedInstance);
            const statusColor = inst?.status === 'connected' ? 'bg-green-500' : inst?.status === 'connecting' ? 'bg-yellow-500' : 'bg-[#6e684a]';
            return <><span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} /><span className="text-[#6e684a]">{inst?.display_name || selectedInstance}</span></>;
          })()}
        </div>
      )}
      <button
        onClick={onCreate}
        disabled={disabled || creating}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#eab308] text-[#181711] text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-[#eab308]/90 transition-all"
      >
        <SendHorizontal className="w-3.5 h-3.5" />
        {creating ? 'Sending…' : scheduledAt ? 'Schedule' : <><Zap className="w-3.5 h-3.5" /> Send Now</>}
      </button>
    </div>
  );
}
