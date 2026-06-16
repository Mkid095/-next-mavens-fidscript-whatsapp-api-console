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
    pct: Math.round((d.messages_sent / maxSent) * 100),
    active: d.messages_sent > 0,
  }));

  return (
    <div className="lg:col-span-2 bg-white border border-[#eaebe4] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-bold text-[#181711]">Messages per Day</h3>
          <p className="text-xs text-stone-400">Daily volume — last 7 days</p>
        </div>
        <div className="flex items-center gap-1 bg-[#f9f9f2] border border-[#eaebe4] rounded-xl px-3 py-1.5 text-xs text-stone-500 font-medium">
          Last 7 days
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      <div className="relative pt-4 pb-2">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-[#181711] text-white text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-2 border border-[#3d3a1e] pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
          <span>{bars.reduce((s, b) => s + b.pct, 0).toLocaleString()} total msgs</span>
        </div>

        <div className="flex items-end justify-between gap-1 h-36 border-b border-dashed border-[#eaebe4]">
          {bars.map((bar, idx) => (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center group cursor-pointer"
              onMouseEnter={() => setHoveredBar(idx)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div
                className={`w-full rounded-t transition-all ${
                  bar.active
                    ? 'bg-yellow-500'
                    : hoveredBar === idx ? 'bg-[#eab308]/40' : 'bg-[#f0f0eb]'
                }`}
                style={{ height: `${Math.max(bar.pct, 4)}%` }}
              />
              <span className="text-[9px] font-bold mt-2 text-stone-400 group-hover:text-[#181711] transition-colors">
                {bar.week}
              </span>

              {hoveredBar === idx && (
                <div className="absolute bottom-full mb-1 bg-[#181711] text-white text-[9px] px-2 py-1 rounded font-mono pointer-events-none z-20 whitespace-nowrap">
                  {dailyTrends[idx]?.messages_sent.toLocaleString() ?? 0} msgs
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
