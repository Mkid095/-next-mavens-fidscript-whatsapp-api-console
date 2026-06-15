import { useState } from 'react';
import type { Segment } from '../../data/api/platform.js';
import { useSegmentPreview } from '../../data/hooks/useSegments.js';
import { SegmentList } from '../segments/index.js';

interface SegmentAudiencePickerProps {
  selectedSegmentId: string | null;
  onSelect: (segmentId: string | null, resolvedPhones: string[], count: number) => void;
}

/**
 * Phase 5 Slice C — the "From segment" tab inside AudiencePicker. Two-step
 * flow: (1) pick a saved segment from the inline list; (2) preview resolves
 * the segment to its phones and reports back to the parent. The parent owns
 * the final phone list, so the rest of CampaignBuilder is unaware of segments.
 */
export default function SegmentAudiencePicker({ selectedSegmentId, onSelect }: SegmentAudiencePickerProps) {
  const { preview, loading, error, run } = useSegmentPreview();
  const [picked, setPicked] = useState<Segment | null>(null);

  const pick = (s: Segment) => {
    setPicked(s);
    // Resolve immediately so the parent can update its count without an extra click
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
      <div className="p-3 bg-white border border-[#eaebe4] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-graphite uppercase">Selected segment</p>
            <p className="text-xs font-bold text-stone-700">{picked.name}</p>
          </div>
          <button onClick={clear} className="text-[10px] text-stone-500 hover:text-red-600">Clear</button>
        </div>
        {error && <p className="text-[11px] text-red-600">{error}</p>}
        {loading && <p className="text-[10px] text-stone-400">Resolving…</p>}
        {preview && (
          <p className="text-[10px] text-stone-500">
            <span className="font-bold text-forest-deep">{preview.customer_count}</span> customers matched · {preview.phones.length} phones
          </p>
        )}
      </div>
    );
  }

  return <SegmentList onCreate={undefined as never} onPick={pick} pickMode />;
}
