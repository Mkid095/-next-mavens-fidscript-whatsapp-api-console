/**
 * ChatbotsAdminView — admin cross-workspace chatbot analytics.
 * Fetches GET /api/admin/chatbot-analytics and renders:
 *   - totals (chatbots / enabled / traces-this-week / tokens-this-week)
 *   - per-client breakdown (top workspaces by chatbot count + token usage)
 *   - per-LLM-provider breakdown (which providers are most-used via chatbots)
 *   - response-type + hallucination-policy + confidence-threshold distributions
 *   - recent traces (last 10 chatbot interactions)
 */
import React, { useEffect, useState } from 'react';
import {
  Bot, Users, Cpu, ShieldCheck, History, Zap, AlertTriangle,
  RefreshCw, MessageSquare, Layers,
} from 'lucide-react';
import { fetchApi, getAdminToken } from '../../../data/api/client';

interface Totals {
  chatbots_total: number;
  chatbots_enabled: number;
  llm_connections_active: number;
  workspaces_with_chatbots: number;
  tokens_this_week: number;
  traces_this_week: number;
}

interface PerClient {
  client_id: string;
  client_name: string;
  email: string;
  plan_id: string | null;
  chatbot_count: number;
  enabled_count: number;
  tokens_this_week: number;
}

interface PerProvider {
  provider: string;
  model: string;
  chatbot_count: number;
  workspace_count: number;
}

interface ResponseType { type: string; count: number; }
interface HalluPolicy { policy: string; count: number; }
interface ConfidenceRow {
  chatbot_id: string; chatbot_name: string;
  confidence_threshold: number; escalate_on_low_confidence: number;
  fallback_reply: string | null;
}
interface RecentTrace {
  id: string; chatbot_id: string; chatbot_name: string | null;
  conversation_id: string | null; prompt: string | null; response: string | null;
  input_tokens: number; output_tokens: number; total_tokens: number;
  cost_usd: number; model: string | null; provider: string | null; created_at: string;
}

interface AnalyticsPayload {
  totals: Totals;
  perClient: PerClient[];
  perProvider: PerProvider[];
  responseTypes: ResponseType[];
  hallucinationPolicies: HalluPolicy[];
  confidenceThresholds: ConfidenceRow[];
  recentTraces: RecentTrace[];
  as_of: string;
}

export default function ChatbotsAdminView() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const reload = (): void => {
    setLoading(true);
    const token = getAdminToken();
    if (!token) { setErr('Admin token missing.'); setLoading(false); return; }
    fetchApi<{ success: boolean; data?: AnalyticsPayload; error?: string }>(
      '/api/admin/chatbot-analytics',
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
    ).then((res) => {
      if (res.success && res.data) setData(res.data);
      else setErr(res.error || 'Failed to load chatbot analytics');
      setLoading(false);
    }).catch((e: Error) => {
      setErr(e.message);
      setLoading(false);
    });
  };

  useEffect(() => { reload(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#6e684a]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading chatbot analytics…
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="p-6 rounded-2xl border border-red-900/40 bg-red-900/10 text-red-400 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Could not load chatbot analytics</p>
          <p className="text-xs mt-1">{err}</p>
          <button onClick={reload} className="mt-3 text-xs underline">Retry</button>
        </div>
      </div>
    );
  }

  const t = data.totals;
  const fmtTokens = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#cbd3cf] flex items-center gap-2">
            <Bot className="w-6 h-6 text-yellow-500" /> Chatbots
          </h1>
          <p className="text-xs text-[#6e684a] mt-1">
            Cross-workspace chatbot usage, LLM provider mix, and response shapes — last 7 days
          </p>
        </div>
        <button
          onClick={reload}
          className="px-3 py-1.5 bg-[#1a1915] border border-[#2d2813] rounded-lg text-xs text-[#a8a99e] hover:text-yellow-500 hover:border-[#3d3a1e] transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Totals strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat label="Chatbots" value={t.chatbots_total} icon={<Bot className="w-4 h-4" />} />
        <Stat label="Enabled" value={t.chatbots_enabled} icon={<ShieldCheck className="w-4 h-4" />} />
        <Stat label="Workspaces" value={t.workspaces_with_chatbots} icon={<Users className="w-4 h-4" />} />
        <Stat label="LLM connections" value={t.llm_connections_active} icon={<Cpu className="w-4 h-4" />} />
        <Stat label="Traces (7d)" value={t.traces_this_week} icon={<History className="w-4 h-4" />} />
        <Stat label="Tokens (7d)" value={fmtTokens(t.tokens_this_week)} icon={<Zap className="w-4 h-4" />} />
      </div>

      {/* Two-column: providers + response shapes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="LLM provider / model mix" icon={<Cpu className="w-4 h-4" />}>
          {data.perProvider.length === 0 ? (
            <Empty text="No chatbots have an AI config yet." />
          ) : (
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-[#6a6c5d] border-b border-[#2d2813]">
                <tr><th className="text-left py-1.5">Provider</th><th className="text-left">Model</th><th className="text-right">Chatbots</th><th className="text-right">Workspaces</th></tr>
              </thead>
              <tbody>
                {data.perProvider.map((p, i) => (
                  <tr key={i} className="border-b border-[#2d2813]/50">
                    <td className="py-1.5 font-bold text-[#a8a99e]">{p.provider || <span className="text-[#6a6c5d]">—</span>}</td>
                    <td className="font-mono text-[#a8a99e]">{p.model || <span className="text-[#6a6c5d]">—</span>}</td>
                    <td className="text-right text-yellow-500 font-bold">{p.chatbot_count}</td>
                    <td className="text-right text-[#a8a99e]">{p.workspace_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Response shapes & hallucination policy" icon={<Layers className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6a6c5d] font-bold mb-2">Trigger types</div>
              {data.responseTypes.length === 0 ? <Empty text="No triggers configured." /> : (
                <ul className="space-y-1">
                  {data.responseTypes.map((r, i) => (
                    <li key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#a8a99e]">{r.type}</span>
                      <span className="text-yellow-500 font-bold">{r.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6a6c5d] font-bold mb-2">Hallucination policy</div>
              {data.hallucinationPolicies.length === 0 ? <Empty text="No AI configs." /> : (
                <ul className="space-y-1">
                  {data.hallucinationPolicies.map((r, i) => (
                    <li key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#a8a99e]">{r.policy}</span>
                      <span className={
                        r.policy === 'strict' ? 'text-green-400 font-bold'
                        : r.policy === 'creative' ? 'text-red-400 font-bold'
                        : 'text-[#a8a99e] font-bold'
                      }>{r.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Panel>
      </div>

      {/* Per-client table */}
      <Panel title="Top workspaces by chatbot activity" icon={<Users className="w-4 h-4" />}>
        {data.perClient.length === 0 ? (
          <Empty text="No workspaces have created chatbots yet." />
        ) : (
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-[#6a6c5d] border-b border-[#2d2813]">
              <tr>
                <th className="text-left py-1.5">Workspace</th>
                <th className="text-left">Plan</th>
                <th className="text-right">Chatbots</th>
                <th className="text-right">Enabled</th>
                <th className="text-right">Tokens (7d)</th>
              </tr>
            </thead>
            <tbody>
              {data.perClient.map((c) => (
                <tr key={c.client_id} className="border-b border-[#2d2813]/50">
                  <td className="py-2">
                    <div className="font-bold text-[#cbd3cf]">{c.client_name}</div>
                    <div className="text-[10px] text-[#6a6c5d] font-mono">{c.email}</div>
                  </td>
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

      {/* Confidence thresholds */}
      <Panel title="Confidence thresholds (calibration)" icon={<ShieldCheck className="w-4 h-4" />}>
        {data.confidenceThresholds.length === 0 ? (
          <Empty text="No policies set yet." />
        ) : (
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-[#6a6c5d] border-b border-[#2d2813]">
              <tr>
                <th className="text-left py-1.5">Chatbot</th>
                <th className="text-right">Threshold</th>
                <th className="text-right">Escalate?</th>
                <th className="text-left">Fallback</th>
              </tr>
            </thead>
            <tbody>
              {data.confidenceThresholds.map((row, i) => (
                <tr key={i} className="border-b border-[#2d2813]/50">
                  <td className="py-1.5 text-[#a8a99e]">{row.chatbot_name ?? row.chatbot_id}</td>
                  <td className="text-right font-mono text-yellow-500">{(row.confidence_threshold ?? 0).toFixed(2)}</td>
                  <td className="text-right text-[#a8a99e]">
                    {row.escalate_on_low_confidence ? <span className="text-green-400">yes</span> : <span className="text-[#6a6c5d]">no</span>}
                  </td>
                  <td className="text-[#a8a99e] truncate max-w-xs" title={row.fallback_reply ?? ''}>
                    {row.fallback_reply || <span className="text-[#6a6c5d]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {/* Recent traces */}
      <Panel title="Recent traces (last 10)" icon={<History className="w-4 h-4" />}>
        {data.recentTraces.length === 0 ? (
          <Empty text="No traces yet." />
        ) : (
          <ol className="space-y-3">
            {data.recentTraces.map((t) => (
              <li key={t.id} className="bg-[#181711] border border-[#2d2813] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] uppercase tracking-wider text-[#6a6c5d] font-bold">
                    {t.chatbot_name ?? t.chatbot_id} · {t.provider ?? '?'} · {t.model ?? '?'}
                  </div>
                  <div className="text-[10px] text-[#6a6c5d]">{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <p className="text-xs text-[#cbd3cf]"><span className="text-[#6a6c5d]">›</span> {truncate(t.prompt, 220)}</p>
                <p className="text-xs text-[#a8a99e] mt-1"><span className="text-yellow-500">‹</span> {truncate(t.response, 220)}</p>
                <div className="text-[10px] text-[#6a6c5d] mt-1.5 flex gap-3">
                  <span>in <span className="text-[#a8a99e]">{t.input_tokens}</span> tok</span>
                  <span>out <span className="text-[#a8a99e]">{t.output_tokens}</span> tok</span>
                  <span>${(t.cost_usd ?? 0).toFixed(4)}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#6a6c5d] font-bold">
        <span className="text-yellow-500">{icon}</span> {label}
      </div>
      <div className="text-2xl font-black text-[#cbd3cf] mt-1">{value}</div>
    </div>
  );
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

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-[#6a6c5d] italic py-3 text-center">{text}</p>;
}

function truncate(s: string | null, n: number): string {
  if (!s) return '—';
  return s.length > n ? s.slice(0, n) + '…' : s;
}