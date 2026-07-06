/**
 * AnalyticsStep — Step 10 of the Chatbot Builder.
 * Thin shell: owns time-range state, delegates charts to sub-components.
 */
import React, { useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import { AnalyticsCharts } from './AnalyticsCharts';
import { AnalyticsStats } from './AnalyticsStats';

export default function AnalyticsStep() {
  const { draft } = useChatbotBuilderStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => { setLastRefresh(new Date()); setLoading(false); }, 800);
  };

  const timeRanges: { value: typeof timeRange; label: string }[] = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
  ];

  const isEnabled = Boolean(draft.id);

  if (!isEnabled) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
          <BarChart3 className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">Analytics</p>
            <p className="text-xs text-[#8f834a] mt-0.5">Save the chatbot to see its performance metrics.</p>
          </div>
        </div>
        <div className="text-center py-16 border-2 border-dashed border-[#2d2813] rounded-2xl">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-[#3d3823]" />
          <p className="text-sm font-semibold text-[#6e684a]">No analytics yet</p>
          <p className="text-xs text-[#5a554a] mt-1">Save and enable your chatbot to start collecting analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
        <BarChart3 className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">Analytics</p>
            <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live
            </span>
          </div>
          <p className="text-xs text-[#8f834a] mt-0.5">
            Performance metrics for <span className="text-white font-semibold">{draft.general.name || 'this chatbot'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-1 shrink-0">
          {timeRanges.map(r => (
            <button
              key={r.value}
              onClick={() => setTimeRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeRange === r.value ? 'bg-yellow-500 text-black' : 'text-[#6e684a] hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button onClick={handleRefresh} disabled={loading} className="p-2 text-[#6e684a] hover:text-white transition shrink-0" title={`Updated ${lastRefresh.toLocaleTimeString()}`}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI cards */}
      <AnalyticsStats />

      {/* Charts */}
      <AnalyticsCharts timeRange={timeRange} />
    </div>
  );
}
