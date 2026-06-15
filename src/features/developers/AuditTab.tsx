import { useState } from 'react';
import { Shield } from 'lucide-react';
import { useAuditLog } from '../../data/hooks/useWebhooks';

const RESOURCE_OPTIONS = ['', 'conversation', 'customer', 'ai_handoff', 'integration', 'campaign'];

export default function AuditTab() {
  const [resource, setResource] = useState('');
  const { entries, loading } = useAuditLog({ resource: resource || undefined });

  if (loading) return <p className="text-xs text-stone-500">Loading audit log…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-graphite flex-1">State-changing events recorded for compliance & security review.</p>
        <select value={resource} onChange={e => setResource(e.target.value)}
          className="px-2 py-1.5 border border-[#eaebe4] rounded-xl text-xs bg-white">
          {RESOURCE_OPTIONS.map(r => <option key={r} value={r}>{r || 'All resources'}</option>)}
        </select>
      </div>

      {entries.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <Shield className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-xs font-bold text-forest-deep">No audit entries yet</p>
        </div>
      ) : (
        <div className="border border-[#eaebe4] rounded-2xl overflow-hidden">
          <table className="w-full text-[10px]">
            <thead className="bg-stone-50 text-graphite">
              <tr>
                <th className="text-left px-3 py-2 font-bold">When</th>
                <th className="text-left px-3 py-2 font-bold">Action</th>
                <th className="text-left px-3 py-2 font-bold">Entity</th>
                <th className="text-left px-3 py-2 font-bold">Actor</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-t border-[#eaebe4]">
                  <td className="px-3 py-1.5 font-mono text-stone-500">{new Date(e.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-3 py-1.5 font-mono text-forest-deep">{e.action}</td>
                  <td className="px-3 py-1.5 font-mono text-stone-600">{e.entity_type}/{e.entity_id.slice(0, 12)}</td>
                  <td className="px-3 py-1.5 text-stone-500">{e.actor_user_id ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
