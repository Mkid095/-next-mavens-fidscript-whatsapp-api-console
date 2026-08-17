import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useDeveloperLogs } from '../../data/hooks/developers/useWebhooks.js';

const METHOD_OPTIONS = ['', 'GET', 'POST', 'PATCH', 'DELETE', 'PUT'];

function colorFor(status: number): string {
  if (status >= 500) return 'text-red-600 bg-red-50';
  if (status >= 400) return 'text-amber-700 bg-amber-50';
  if (status >= 300) return 'text-blue-600 bg-blue-50';
  return 'text-green-700 bg-green-50';
}

export default function DevLogsTab() {
  const [method, setMethod] = useState('');
  const [minLatency, setMinLatency] = useState<string>('');
  const { entries, loading } = useDeveloperLogs({
    method: method || undefined,
    minLatency: minLatency ? parseInt(minLatency, 10) : undefined,
  });

  if (loading) return <p className="text-xs text-stone-500">Loading API logs…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-graphite flex-1">Recent API requests with latency.</p>
        <select value={method} onChange={e => setMethod(e.target.value)}
          className="px-2 py-1.5 border border-[#eaebe4] rounded-xl text-xs bg-white">
          {METHOD_OPTIONS.map(m => <option key={m} value={m}>{m || 'All methods'}</option>)}
        </select>
        <input type="number" placeholder="Min ms" value={minLatency}
          onChange={e => setMinLatency(e.target.value)}
          className="w-20 px-2 py-1.5 border border-[#eaebe4] rounded-xl text-xs bg-white" />
      </div>

      {entries.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <Activity className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-xs font-bold text-forest-deep">No API requests yet</p>
        </div>
      ) : (
        <div className="border border-[#eaebe4] rounded-2xl overflow-hidden">
          <table className="w-full text-[10px]">
            <thead className="bg-stone-50 text-graphite">
              <tr>
                <th className="text-left px-3 py-2 font-bold">When</th>
                <th className="text-left px-3 py-2 font-bold">Method</th>
                <th className="text-left px-3 py-2 font-bold">Endpoint</th>
                <th className="text-left px-3 py-2 font-bold">Status</th>
                <th className="text-right px-3 py-2 font-bold">Latency</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-t border-[#eaebe4]">
                  <td className="px-3 py-1.5 font-mono text-stone-500">{new Date(e.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                  <td className="px-3 py-1.5 font-mono font-bold">{e.method}</td>
                  <td className="px-3 py-1.5 font-mono text-forest-deep truncate max-w-xs">{e.endpoint}</td>
                  <td className="px-3 py-1.5"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${colorFor(e.response_status)}`}>{e.response_status}</span></td>
                  <td className="px-3 py-1.5 text-right font-mono">{e.latency_ms != null ? `${e.latency_ms}ms` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
