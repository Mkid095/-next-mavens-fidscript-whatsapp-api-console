import { useState } from 'react';
import type { Segment } from '../../data/api/platform.js';
import { useSegmentPreview } from '../../data/hooks/segments/useSegments.js';
import { SegmentList } from '../segments/index.js';

interface SegmentAudiencePickerProps {
  selectedSegmentId: string | null;
  onSelect: (segmentId: string | null, resolvedPhones: string[], count: number) => void;
}

export default function SegmentAudiencePicker({ selectedSegmentId, onSelect }: SegmentAudiencePickerProps) {
  const { preview, loading, error, run } = useSegmentPreview();
  const [picked, setPicked] = useState<Segment | null>(null);

  const pick = (s: Segment) => {
    setPicked(s);
    run(s.filter).then(res => {
      if (res.success && res.data) {
        onSelect(s.id, res.data.phones, res.data.customer_count);
      }
    });
  };

  const clear = () => {
    setPicked(null);
    onSelect(null, [], 0);
  };

  if (picked) {
    return (
      <div className="p-3 bg-[#1a1915] border border-[#2d2813] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#6e684a] uppercase">Selected segment</p>
            <p className="text-xs font-bold text-[#a8a99e]">{picked.name}</p>
          </div>
          <button onClick={clear} className="text-[10px] text-[#6e684a] hover:text-red-400">Clear</button>
        </div>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
        {loading && <p className="text-[10px] text-[#6e684a]">Resolving…</p>}
        {preview && (
          <p className="text-[10px] text-[#6e684a]">
            <span className="font-bold text-[#eab308]">{preview.customer_count}</span> customers matched · {preview.phones.length} phones
          </p>
        )}
      </div>
    );
  }

  return <SegmentList onCreate={undefined as never} onPick={pick} pickMode />;
}
