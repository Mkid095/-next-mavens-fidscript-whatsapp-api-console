import { useEffect, useState } from 'react';
import { Megaphone, Plus, Play, Copy, Trash2, Filter } from 'lucide-react';
import { campaignsApi } from '../../services/api';
import type { Campaign } from '../../services/api';

interface CampaignListProps {
  clientToken?: string;
  onCreate: () => void;
  onLaunch: (id: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  broadcast: 'Broadcast',
  scheduled: 'Scheduled',
  segmented: 'Segmented',
  trigger: 'Trigger',
  drip: 'Drip',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-[#2d2813] text-[#a8a99e]',
  scheduled: 'bg-blue-900/40 text-blue-400 border-blue-800/50',
  sending: 'bg-yellow-900/30 text-yellow-500 border-yellow-700/50 animate-pulse',
  completed: 'bg-green-900/40 text-green-400 border-green-800/50',
  cancelled: 'bg-[#2d2813] text-[#6e684a]',
  failed: 'bg-red-900/30 text-red-400 border-red-800/40',
};

export default function CampaignList({ clientToken, onCreate, onLaunch }: CampaignListProps) {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!clientToken) return;
    setLoading(true);
    const res = await campaignsApi.getAll();
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientToken]);

  const filtered = typeFilter === 'all' ? items : items.filter(c => (c as Campaign & { type?: string }).type === typeFilter || c.message_type === typeFilter);

  const handleDuplicate = async (id: string) => {
    setBusyId(id);
    await campaignsApi.duplicate(id);
    await load();
    setBusyId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete campaign "${name}"?`)) return;
    setBusyId(id);
    await campaignsApi.delete(id);
    await load();
    setBusyId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#6e684a]" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-xs border border-[#2d2813] rounded-lg px-2.5 py-1.5 bg-[#1a1915] text-[#a8a99e] focus:outline-none focus:border-[#eab308]"
          >
            <option value="all">All types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eab308] hover:bg-[#eab308]/90 text-[#181711] text-xs font-bold rounded-xl"
        >
          <Plus className="w-3.5 h-3.5" /> New campaign
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-[#6e684a] px-2">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <Megaphone className="w-10 h-10 text-[#eab308]/30 mx-auto" />
          <p className="text-xs font-bold text-[#a8a99e]">No campaigns yet</p>
          <p className="text-[11px] text-[#6e684a]">Create a broadcast, schedule, or trigger-based campaign.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const type = (c as Campaign & { type?: string }).type || 'broadcast';
            const status = c.status as keyof typeof STATUS_COLORS;
            const statusClass = STATUS_COLORS[status] || STATUS_COLORS.draft;
            const completed = c.status === 'completed';
            const draft = c.status === 'draft' || c.status === 'scheduled';
            return (
              <div key={c.id} className="p-3 border border-[#2d2813] rounded-xl bg-[#181711] hover:border-[#3d3a1e] transition-colors flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-[#a8a99e] truncate">{c.name}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2d2813] text-[#a8a99e]">{TYPE_LABELS[type] || type}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusClass}`}>{c.status}</span>
                  </div>
                  <p className="text-[10px] text-[#6e684a] mt-0.5">
                    {c.total_recipients} recipients · {c.sent_count} sent · {c.failed_count} failed
                    {c.completed_at ? ` · ${new Date(c.completed_at).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {draft && (
                    <button
                      onClick={() => onLaunch(c.id)}
                      disabled={busyId === c.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-[#eab308] text-[#181711] rounded-lg disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" /> Launch
                    </button>
                  )}
                  {completed && (
                    <button
                      onClick={() => handleDuplicate(c.id)}
                      disabled={busyId === c.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-[#2d2813] text-[#a8a99e] border border-[#3d3a1e] rounded-lg disabled:opacity-50"
                    >
                      <Copy className="w-3 h-3" /> Reuse
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    disabled={busyId === c.id}
                    className="p-1.5 text-[#6e684a] hover:text-red-400 bg-[#1a1915] border border-[#2d2813] rounded-lg disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
