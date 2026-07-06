/**
 * AnalyticsCharts — bar chart + donut chart + top triggers table.
 */
import React, { useState } from 'react';
import { Zap } from 'lucide-react';

const MOCK_DAILY_VOLUME = [
  { day: 'Mon', conversations: 42, messages: 187 },
  { day: 'Tue', conversations: 58, messages: 241 },
  { day: 'Wed', conversations: 37, messages: 163 },
  { day: 'Thu', conversations: 73, messages: 318 },
  { day: 'Fri', conversations: 91, messages: 402 },
  { day: 'Sat', conversations: 28, messages: 114 },
  { day: 'Sun', conversations: 19, messages: 87 },
];

const MOCK_TRIGGERS = [
  { keyword: 'pricing', fires: 142, satisfaction: 94 },
  { keyword: 'demo', fires: 98, satisfaction: 88 },
  { keyword: 'support', fires: 76, satisfaction: 71 },
  { keyword: 'hours', fires: 64, satisfaction: 99 },
  { keyword: 'refund', fires: 41, satisfaction: 65 },
];

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cumulative = 0;
  const circles = segments.map((seg, i) => {
    const pct = seg.value / total;
    const dashArray = `${(pct * 251.2).toFixed(1)} 251.2`;
    const dashOffset = (-cumulative * 251.2).toFixed(1);
    cumulative += pct;
    return (
      <circle key={i} cx="40" cy="40" r="32" fill="none" stroke={seg.color} strokeWidth="10"
        strokeDasharray={dashArray} strokeDashoffset={dashOffset} transform="rotate(-90 40 40)" />
    );
  });
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full">
        <circle cx="40" cy="40" r="32" fill="none" stroke="#2d2813" strokeWidth="10" />{circles}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center"><span className="text-xs text-white font-bold">{total}</span></div>
    </div>
  );
}

function BarChart({ data, metric }: { data: typeof MOCK_DAILY_VOLUME; metric: 'conversations' | 'messages' }) {
  const maxVal = Math.max(...data.map(d => d[metric]));
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => {
        const heightPct = (d[metric] / maxVal) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col items-center justify-end h-28">
              <div className="w-full max-w-[32px] rounded-t-md bg-yellow-400/80 hover:bg-yellow-400 transition-all relative group" style={{ height: `${heightPct}%`, minHeight: '4px' }}>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#1a1915] border border-[#2d2813] rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                  <p className="text-[10px] text-white font-semibold">{d[metric]}</p>
                </div>
              </div>
            </div>
            <span className="text-[9px] text-[#6e684a]">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 40" className="w-full h-8" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function AnalyticsCharts({ timeRange }: { timeRange: '7d' | '30d' | '90d' }) {
  const [chartMetric, setChartMetric] = useState<'conversations' | 'messages'>('conversations');

  const responseBreakdown = [
    { label: 'AI Responses', value: 291, color: '#eab308' },
    { label: 'Rule-based', value: 38, color: '#3b82f6' },
    { label: 'Human Handoff', value: 19, color: '#ef4444' },
  ];

  const totalConversations = 348;

  return (
    <>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Conversation volume */}
        <div className="lg:col-span-3 bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Conversation Volume</p>
              <p className="text-[10px] text-[#6e684a] mt-0.5">Daily breakdown for the last 7 days</p>
            </div>
            <div className="flex items-center gap-1 bg-[#1a1915] border border-[#2d2813] rounded-lg p-1">
              {(['conversations', 'messages'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setChartMetric(m)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold capitalize transition ${
                    chartMetric === m ? 'bg-yellow-500 text-black' : 'text-[#6e684a] hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <BarChart data={MOCK_DAILY_VOLUME} metric={chartMetric} />
          <div className="flex items-center justify-between text-[10px] text-[#5a554a]">
            <span>Low: {Math.min(...MOCK_DAILY_VOLUME.map(d => d[chartMetric]))}</span>
            <span>High: {Math.max(...MOCK_DAILY_VOLUME.map(d => d[chartMetric]))}</span>
          </div>
        </div>

        {/* Response breakdown */}
        <div className="lg:col-span-2 bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-white">Response Breakdown</p>
            <p className="text-[10px] text-[#6e684a] mt-0.5">How the bot handled {totalConversations} conversations</p>
          </div>
          <div className="flex items-center gap-4">
            <DonutChart segments={responseBreakdown} />
            <div className="space-y-2.5 flex-1">
              {responseBreakdown.map(seg => (
                <div key={seg.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
                    <span className="text-xs text-[#a8a99e]">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-mono font-semibold">{seg.value}</span>
                    <span className="text-[10px] text-[#5a554a]">({Math.round((seg.value / totalConversations) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top triggers */}
      <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2d2813] flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <p className="text-sm font-semibold text-white">Top Triggers</p>
          <span className="ml-auto text-[10px] text-[#6e684a]">Ranked by fire count · last 7 days</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2d2813]">
              <th className="text-left px-4 py-2.5 text-[10px] text-[#6e684a] font-semibold uppercase tracking-wide">#</th>
              <th className="text-left px-4 py-2.5 text-[10px] text-[#6e684a] font-semibold uppercase tracking-wide">Keyword</th>
              <th className="text-right px-4 py-2.5 text-[10px] text-[#6e684a] font-semibold uppercase tracking-wide">Fires</th>
              <th className="text-right px-4 py-2.5 text-[10px] text-[#6e684a] font-semibold uppercase tracking-wide">CSAT</th>
              <th className="text-left px-4 py-2.5 text-[10px] text-[#6e684a] font-semibold uppercase tracking-wide">Trend</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TRIGGERS.map((t, i) => (
              <tr key={t.keyword} className="border-b border-[#2d2813]/50 hover:bg-white/[0.02] transition">
                <td className="px-4 py-3 text-xs text-[#5a554a]">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono bg-yellow-500/10 text-yellow-300 border border-yellow-500/10 px-2 py-1 rounded">{t.keyword}</span>
                </td>
                <td className="px-4 py-3 text-right text-xs text-white font-mono font-semibold">{t.fires}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-semibold ${t.satisfaction >= 90 ? 'text-green-400' : t.satisfaction >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{t.satisfaction}%</span>
                </td>
                <td className="px-4 py-3">
                  <MiniSparkline data={[80, 95, 110, 105, 130, 140, 142].map(v => v + Math.random() * 10)} color={t.satisfaction >= 80 ? '#4ade80' : '#f97316'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
