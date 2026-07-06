import type { SegmentPreview as SegmentPreviewData } from '../../data/api/platform.js';

interface SegmentPreviewProps {
  preview: SegmentPreviewData | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
}

/** Small panel that shows the resolver's output: customer count, sample of
 *  matched phones, and the timestamp of the last computation. */
export default function SegmentPreview({ preview, loading, error, onRun }: SegmentPreviewProps) {
  return (
    <div className="p-3 bg-[#181711] border border-[#2d2813] rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-[#6e684a] uppercase">Preview</p>
        <button onClick={onRun} disabled={loading}
          className="px-2.5 py-1 text-[10px] font-bold bg-[#eab308] text-[#181711] rounded-lg disabled:opacity-50">
          {loading ? 'Running…' : preview ? 'Re-run' : 'Run preview'}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {preview && (
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-[#eab308]">{preview.customer_count} customer{preview.customer_count === 1 ? '' : 's'} match</p>
          {preview.sample_phones.length > 0 && (
            <p className="text-[10px] text-[#6e684a] font-mono break-all">
              {preview.sample_phones.slice(0, 5).join(', ')}{preview.sample_phones.length > 5 ? `, +${preview.sample_phones.length - 5} more` : ''}
            </p>
          )}
          <p className="text-[9px] text-[#5a554a]">Computed {new Date(preview.computed_at).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
