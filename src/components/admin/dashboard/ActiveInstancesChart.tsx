import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { DailyTrend } from '../../../services/types';

interface ActiveInstancesChartProps {
  dailyTrends?: DailyTrend[];
}

export default function ActiveInstancesChart({ dailyTrends = [] }: ActiveInstancesChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const maxSent = Math.max(...dailyTrends.map(d => d.messages_sent), 1);

  const bars = dailyTrends.map(d => ({
    week: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: Math.round((d.messages_sent / maxSent) * 100),
    active: d.messages_sent > 0,
  }));

  return (
    <div className="lg:col-span-2 bg-white border border-[#e1e9e5]/80 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-forest-deep">Messages per Day</h3>
            <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Live</span>
          </div>
          <p className="text-xs text-graphite">Daily message volume across all clients — last 7 days</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs font-bold bg-[#10231d]/5 hover:bg-[#10231d]/10 rounded-xl px-3 py-1.5 flex items-center gap-1 text-emerald-950">
            <span>Last 7 days</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="relative pt-6 pb-2">
        <div className="absolute top-0 left-[50%] transform -translate-x-[50%] z-10 bg-[#09100f] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 border border-[#1b2d26] shadow-md pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{bars.reduce((s, b) => s + b.value, 0).toLocaleString()} total messages</span>
        </div>

        <div className="flex items-end justify-between gap-1 h-36 border-b border-dashed border-[#e2e8f0]">
          {bars.map((bar, idx) => (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center group relative cursor-pointer"
              onMouseEnter={() => setHoveredBar(idx)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div
                className={`w-full rounded-t transition-all ${
                  bar.active
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                    : hoveredBar === idx ? 'bg-[#0f402c]' : 'bg-[#15342a]/20'
                }`}
                style={{ height: `${Math.max(bar.value, 4)}%` }}
              />
              <span className="text-[9px] font-bold mt-2 text-graphite group-hover:text-forest-deep transition-colors">
                {bar.week}
              </span>

              {hoveredBar === idx && (
                <div className="absolute bottom-full mb-1 bg-forest-deep text-white text-[9px] px-1.5 py-0.5 rounded font-mono pointer-events-none z-20">
                  {dailyTrends[idx]?.messages_sent.toLocaleString() ?? 0} sent
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
