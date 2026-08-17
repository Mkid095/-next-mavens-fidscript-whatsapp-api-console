import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import type { DailyTrend } from '../../../services/types';

const METRICS = {
  sent: { label: 'Outgoing', color: '#059669', bg: 'bg-emerald-500' },
  received: { label: 'Incoming', color: '#3b82f6', bg: 'bg-blue-500' },
} as const;

interface TelemetryChartProps {
  dailyTrends?: DailyTrend[];
}

export default function TelemetryChart({ dailyTrends = [] }: TelemetryChartProps) {
  const [metric, setMetric] = useState<'sent' | 'received'>('sent');
  const cfg = METRICS[metric];
  const maxVal = Math.max(...dailyTrends.map(d => metric === 'sent' ? d.messages_sent : d.messages_delivered), 1);

  const labels = dailyTrends.map(d =>
    new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
  );

  return (
    <div className="space-y-6 bg-white border border-[#e1e9e5]/80 rounded-3xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#15803d] font-bold">Real-Time Node Monitors</span>
          <h3 className="text-sm font-bold text-forest-deep mt-1">
            {cfg.label} Messages - Last 7 Days
          </h3>
          <p className="text-xs text-graphite mt-0.5">
            Daily {cfg.label.toLowerCase()} message volume
          </p>
        </div>

        <div className="inline-flex p-1 bg-[#10231d]/5 rounded-xl border border-[#d2e2db]">
          {(Object.keys(METRICS) as Array<keyof typeof METRICS>).map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                metric === key ? 'bg-white text-emerald-950 shadow-sm' : 'text-[#4d665a] hover:text-emerald-950'
              }`}
            >
              {METRICS[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className="relative pt-2">
        <div className="w-full bg-stone-50 rounded-[20px] h-[200px] relative border border-[#e1e9e5]/80 flex items-end p-4 pb-8">
          <svg className="w-full h-full" viewBox={`0 0 ${dailyTrends.length * 100} 160`} preserveAspectRatio="none">
            {dailyTrends.map((d, i) => {
              const val = metric === 'sent' ? d.messages_sent : d.messages_delivered;
              const height = maxVal > 0 ? (val / maxVal) * 130 : 0;
              const x = i * 100 + 10;
              return (
                <g key={i}>
                  <motion.rect
                    x={x}
                    y={140 - height}
                    width={60}
                    height={height}
                    rx={6}
                    fill={cfg.color}
                    initial={{ height: 0, y: 140 }}
                    animate={{ height, y: 140 - height }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    opacity={0.9}
                  />
                  <text
                    x={x + 30}
                    y={155}
                    textAnchor="middle"
                    className="fill-stone-400"
                    style={{ fontSize: '9px', fontFamily: 'monospace' }}
                  >
                    {labels[i]}
                  </text>
                  <text
                    x={x + 30}
                    y={138 - height}
                    textAnchor="middle"
                    className="fill-stone-600"
                    style={{ fontSize: '8px', fontFamily: 'monospace' }}
                  >
                    {val > 0 ? val.toLocaleString() : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Summary row */}
      <div className="p-3 bg-stone-50 border border-stone-100 rounded-xl">
        <p className="text-[10px] text-stone-500">
          Total {cfg.label}:{' '}
          <span className="font-bold text-forest-deep">
            {dailyTrends.reduce((s, d) => s + (metric === 'sent' ? d.messages_sent : d.messages_delivered), 0).toLocaleString()}
          </span>{' '}
          messages this week
        </p>
      </div>
    </div>
  );
}
