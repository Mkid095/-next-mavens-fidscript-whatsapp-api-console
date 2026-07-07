import { useState } from 'react';
import { Plus, Users, Clock, Search, Trash2 } from 'lucide-react';
import type { Segment } from '../../data/api/platform.js';
import { useSegments } from '../../data/hooks/segments/useSegments.js';

interface SegmentListProps {
  onCreate: () => void;
  onPick?: (segment: Segment) => void;
  pickMode?: boolean;
}

/**
 * Phase 5 Slice C — Segment list. Two modes:
 *   - Management (no onPick): name, count, last computed, delete
 *   - Pick (onPick provided): adds a "Use" button to each row, used by
 *     CampaignBuilder's "From segment" audience mode.
 */
export default function SegmentList({ onCreate, onPick, pickMode }: SegmentListProps) {
  const { segments, loading, error, remove } = useSegments();
  const [q, setQ] = useState('');

  const filtered = segments.filter(s => !q.trim() || s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[160px] relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#6e684a]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search segments…"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-lg placeholder:text-[#5a554a]" />
        </div>
        {!pickMode && (
          <button onClick={onCreate}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-[#eab308] text-[#181711] rounded-lg">
            <Plus className="w-3 h-3" /> New segment
          </button>
        )}
      </div>

      {error && <p className="text-[11px] text-red-400 bg-red-900/30 border border-red-800/40 rounded-lg p-2">{error}</p>}
      {loading && segments.length === 0 && <p className="text-xs text-[#6e684a]">Loading segments…</p>}

      {filtered.length === 0 && !loading ? (
        <div className="p-8 border-2 border-dashed border-[#2d2813] rounded-2xl text-center">
          <Users className="w-8 h-8 mx-auto text-[#6e684a] mb-2" />
          <p className="text-xs text-[#6e684a]">{pickMode ? 'No segments yet — create one to target by audience rules.' : 'No segments yet. Build one to target campaigns by audience rules.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3 bg-[#1a1915] border border-[#2d2813] rounded-xl hover:border-[#3d3a1e] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#2d2813] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#eab308]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#a8a99e] truncate">{s.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-[#6e684a] flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" /> {s.contact_count} {s.contact_count === 1 ? 'customer' : 'customers'}
                  </span>
                  {s.last_computed_at && (
                    <span className="text-[10px] text-[#6e684a] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {new Date(s.last_computed_at).toLocaleDateString()}
                    </span>
                  )}
                  <span className="text-[10px] text-[#6e684a] font-mono">
                    {s.filter.rules.length} rule{s.filter.rules.length === 1 ? '' : 's'} · {s.filter.logic}
                  </span>
                </div>
              </div>
              {pickMode && onPick && (
                <button onClick={() => onPick(s)}
                  className="px-2.5 py-1 text-[10px] font-bold bg-[#eab308] text-[#181711] rounded-lg shrink-0">
                  Use
                </button>
              )}
              {!pickMode && (
                <button onClick={() => { if (confirm(`Delete segment "${s.name}"?`)) remove(s.id); }}
                  className="p-1.5 text-[#6e684a] hover:text-red-400 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
