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
  draft: 'bg-stone-100 text-stone-600',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-stone-100 text-stone-500',
  failed: 'bg-red-100 text-red-700',
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
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 bg-white text-forest-deep focus:outline-none focus:border-yellow-500"
          >
            <option value="all">All types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-deep hover:bg-[#33301a] text-white text-xs font-bold rounded-xl"
        >
          <Plus className="w-3.5 h-3.5" /> New campaign
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-stone-400 px-2">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-stone-400 space-y-2">
          <Megaphone className="w-10 h-10 text-yellow-200 mx-auto" />
          <p className="text-xs font-bold text-forest-deep">No campaigns yet</p>
          <p className="text-[11px] text-graphite">Create a broadcast, schedule, or trigger-based campaign.</p>
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
              <div key={c.id} className="p-3 border border-[#eaebe4] rounded-2xl bg-stone-50 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-forest-deep truncate">{c.name}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">{TYPE_LABELS[type] || type}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusClass}`}>{c.status}</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    {c.total_recipients} recipients · {c.sent_count} sent · {c.failed_count} failed
                    {c.completed_at ? ` · ${new Date(c.completed_at).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {draft && (
                    <button
                      onClick={() => onLaunch(c.id)}
                      disabled={busyId === c.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-forest-deep text-white rounded-lg disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" /> Launch
                    </button>
                  )}
                  {completed && (
                    <button
                      onClick={() => handleDuplicate(c.id)}
                      disabled={busyId === c.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg disabled:opacity-50"
                    >
                      <Copy className="w-3 h-3" /> Reuse
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    disabled={busyId === c.id}
                    className="p-1.5 text-stone-400 hover:text-red-600 bg-white border border-stone-200 rounded-lg disabled:opacity-50"
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
