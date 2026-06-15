import { useState } from 'react';
import { Plus, Trash2, Webhook as WebhookIcon, Copy, Check } from 'lucide-react';
import { platformApi } from '../../data/api';
import { useWebhooks, useWebhookDeliveries } from '../../data/hooks/useWebhooks';
import type { Webhook } from '../../data/api';

const EVENT_OPTIONS = [
  'message.received', 'message.sent', 'message.delivered', 'message.read', 'message.failed',
  'conversation.created', 'conversation.assigned', 'conversation.status_changed',
  'customer.created', 'customer.tagged',
  'campaign.started', 'campaign.completed',
  'ai.reply.generated', 'ai.handoff_requested',
];

export default function WebhooksTab() {
  const { webhooks, loading, refresh } = useWebhooks();
  const [showNew, setShowNew] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>(['*']);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const res = await platformApi.createWebhook({ url: newUrl, events: newEvents });
    if (res.success && res.data) {
      setCreatedSecret(res.data.secret);
      setShowNew(false);
      setNewUrl('');
      refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook?')) return;
    await platformApi.deleteWebhook(id);
    refresh();
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <p className="text-xs text-stone-500">Loading webhooks…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-graphite">Receive signed deliveries on every matching domain event.</p>
        <button onClick={() => setShowNew(true)} className="px-3 py-1.5 bg-forest-deep text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Webhook
        </button>
      </div>

      {createdSecret && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-[10px] font-bold text-amber-900 mb-1">Signing secret — copy now, won't show again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] font-mono bg-white px-2 py-1.5 rounded border border-amber-200 truncate">{createdSecret}</code>
            <button onClick={() => copySecret(createdSecret)} className="p-1.5 bg-white border border-amber-200 rounded-lg">
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button onClick={() => setCreatedSecret(null)} className="text-[10px] text-amber-700 mt-2 underline">Dismiss</button>
        </div>
      )}

      {webhooks.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <WebhookIcon className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-xs font-bold text-forest-deep">No webhooks yet</p>
        </div>
      ) : webhooks.map(wh => <WebhookRow key={wh.id} wh={wh} onDelete={handleDelete} />)}

      {showNew && (
        <div className="p-4 bg-stone-50 border border-[#eaebe4] rounded-2xl space-y-3">
          <input
            type="url" placeholder="https://your-api.com/hook" value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono bg-white"
          />
          <div>
            <p className="text-[10px] font-bold text-graphite mb-1">Events</p>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setNewEvents(['*'])} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${newEvents[0] === '*' ? 'bg-forest-deep text-white' : 'bg-white border border-stone-200'}`}>All (*)</button>
              {EVENT_OPTIONS.map(ev => (
                <button key={ev} onClick={() => setNewEvents(newEvents[0] === '*' ? [ev] : newEvents.includes(ev) ? newEvents.filter(e => e !== ev) : [...newEvents, ev])}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${newEvents.includes(ev) && newEvents[0] !== '*' ? 'bg-forest-deep text-white' : 'bg-white border border-stone-200'}`}>
                  {ev}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="px-3 py-1.5 border border-stone-200 rounded-xl text-xs">Cancel</button>
            <button onClick={handleCreate} disabled={!newUrl} className="px-3 py-1.5 bg-forest-deep text-white rounded-xl text-xs font-bold disabled:opacity-40">Create</button>
          </div>
        </div>
      )}
    </div>
  );
}

function WebhookRow({ wh, onDelete }: { wh: Webhook; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const { deliveries } = useWebhookDeliveries(open ? wh.id : null);
  return (
    <div className="border border-[#eaebe4] rounded-2xl overflow-hidden">
      <div className="p-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-forest-deep truncate">{wh.url}</p>
          <p className="text-[10px] text-stone-500">{wh.events.join(', ')} · {wh.last_delivery_at ? `Last: ${new Date(wh.last_delivery_at).toLocaleString()}` : 'Never delivered'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(!open)} className="text-[10px] font-bold text-stone-500">{open ? 'Hide' : 'Deliveries'}</button>
          <button onClick={() => onDelete(wh.id)} className="p-1.5 text-stone-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {open && (
        <div className="border-t border-[#eaebe4] bg-stone-50 max-h-48 overflow-y-auto">
          {deliveries.length === 0 ? <p className="p-3 text-[10px] text-stone-500">No deliveries yet</p> : deliveries.map(d => (
            <div key={d.id} className="px-3 py-1.5 border-b border-[#eaebe4]/50 flex items-center justify-between text-[10px]">
              <span className="font-mono">{d.event_type}</span>
              <span className={d.response_code >= 200 && d.response_code < 300 ? 'text-green-600' : 'text-red-600'}>
                HTTP {d.response_code} (attempt {d.attempt})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
