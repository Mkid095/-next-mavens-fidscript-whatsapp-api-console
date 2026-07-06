/* ChatbotsAdminView/index.tsx — Thin shell: owns analytics state, renders layout */
import React, { useEffect, useState } from 'react';
import { Bot, Users, Cpu, ShieldCheck, History, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchApi, getAdminToken } from '../../../../data/api/client';
import { StatCard } from './StatCard';
import { ProvidersPanel } from './ProvidersPanel';
import { TracesPanel } from './TracesPanel';
import { ConfidenceTable } from './ConfidenceTable';
import type { AnalyticsPayload } from './types';

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-5">
      <h3 className="text-sm font-bold text-[#cbd3cf] flex items-center gap-1.5 mb-3">
        <span className="text-yellow-500">{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-[#6a6c5d] italic py-3 text-center">{text}</p>;
}

export default function ChatbotsAdminView() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const reload = (): void => {
    setLoading(true);
    const token = getAdminToken();
    if (!token) { setErr('Admin token missing.'); setLoading(false); return; }
    fetchApi<AnalyticsPayload>('/api/admin/chatbot-analytics', {
      method: 'GET', headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.success && res.data) setData(res.data);
      else setErr(res.error || 'Failed to load chatbot analytics');
      setLoading(false);
    }).catch((e: Error) => { setErr(e.message); setLoading(false); });
  };

  useEffect(() => { reload(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-[#6e684a]">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading chatbot analytics…
    </div>
  );

  if (err || !data) return (
    <div className="p-6 rounded-2xl border border-red-900/40 bg-red-900/10 text-red-400 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">Could not load chatbot analytics</p>
        <p className="text-xs mt-1">{err}</p>
        <button onClick={reload} className="mt-3 text-xs underline">Retry</button>
      </div>
    </div>
  );

  const t = data.totals;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#cbd3cf] flex items-center gap-2">
            <Bot className="w-6 h-6 text-yellow-500" /> Chatbots
          </h1>
          <p className="text-xs text-[#6e684a] mt-1">Cross-workspace chatbot usage, LLM provider mix, and response shapes — last 7 days</p>
        </div>
        <button onClick={reload}
          className="px-3 py-1.5 bg-[#1a1915] border border-[#2d2813] rounded-lg text-xs text-[#a8a99e] hover:text-yellow-500 hover:border-[#3d3a1e] transition-colors flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Chatbots" value={t.chatbots_total} icon={<Bot className="w-4 h-4" />} />
        <StatCard label="Enabled" value={t.chatbots_enabled} icon={<ShieldCheck className="w-4 h-4" />} />
        <StatCard label="Workspaces" value={t.workspaces_with_chatbots} icon={<Users className="w-4 h-4" />} />
        <StatCard label="LLM connections" value={t.llm_connections_active} icon={<Cpu className="w-4 h-4" />} />
        <StatCard label="Traces (7d)" value={t.traces_this_week} icon={<History className="w-4 h-4" />} />
        <StatCard label="Tokens (7d)" value={fmtTokens(t.tokens_this_week)} icon={<Zap className="w-4 h-4" />} />
      </div>

      {/* Provider + response shapes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProvidersPanel data={data.perProvider} />

        <Panel title="Response shapes & hallucination policy" icon={<Cpu className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6a6c5d] font-bold mb-2">Trigger types</div>
              {data.responseTypes.length === 0 ? <EmptyState text="No triggers configured." /> :
                <ul className="space-y-1">
                  {data.responseTypes.map((r, i) => (
                    <li key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#a8a99e]">{r.type}</span>
                      <span className="text-yellow-500 font-bold">{r.count}</span>
                    </li>
                  ))}
                </ul>
              }
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6a6c5d] font-bold mb-2">Hallucination policy</div>
              {data.hallucinationPolicies.length === 0 ? <EmptyState text="No AI configs." /> :
                <ul className="space-y-1">
                  {data.hallucinationPolicies.map((r, i) => (
                    <li key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#a8a99e]">{r.policy}</span>
                      <span className={r.policy === 'strict' ? 'text-green-400 font-bold' : r.policy === 'creative' ? 'text-red-400 font-bold' : 'text-[#a8a99e] font-bold'}>{r.count}</span>
                    </li>
                  ))}
                </ul>
              }
            </div>
          </div>
        </Panel>
      </div>

      {/* Per-client */}
      <Panel title="Top workspaces by chatbot activity" icon={<Users className="w-4 h-4" />}>
        {data.perClient.length === 0 ? <EmptyState text="No workspaces have created chatbots yet." /> : (
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-[#6a6c5d] border-b border-[#2d2813]">
              <tr><th className="text-left py-1.5">Workspace</th><th className="text-left">Plan</th><th className="text-right">Chatbots</th><th className="text-right">Enabled</th><th className="text-right">Tokens (7d)</th></tr>
            </thead>
            <tbody>
              {data.perClient.map((c) => (
                <tr key={c.client_id} className="border-b border-[#2d2813]/50">
                  <td className="py-2"><div className="font-bold text-[#cbd3cf]">{c.client_name}</div><div className="text-[10px] text-[#6a6c5d] font-mono">{c.email}</div></td>
                  <td className="text-[#a8a99e]">{c.plan_id ?? <span className="text-[#6a6c5d]">—</span>}</td>
                  <td className="text-right text-[#a8a99e]">{c.chatbot_count}</td>
                  <td className="text-right text-green-400">{c.enabled_count}</td>
                  <td className="text-right text-yellow-500">{fmtTokens(c.tokens_this_week)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <ConfidenceTable rows={data.confidenceThresholds} />

      <TracesPanel traces={data.recentTraces} />
    </div>
  );
}
