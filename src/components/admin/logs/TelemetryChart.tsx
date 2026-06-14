import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Layers } from 'lucide-react';

const metricConfig = {
  latency: {
    title: 'WhatsApp message dispatch latency',
    desc: 'Average delivery execution time from tenant HTTPS rest endpoint trigger to Safaricom carrier packet acknowledgment.',
    unit: 'ms',
    points: [34, 48, 32, 29, 21, 15, 6, 4, 3, 2.5, 1.8],
    labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 'Current'],
  },
  memory: {
    title: 'Isolated WhatsApp multi-device container RAM pool',
    desc: 'Aggregated RAM memory lease allocated to active virtual devices on Nairobi local clusters.',
    unit: '%',
    points: [14, 18, 25, 34, 42, 51, 44, 42, 40, 39, 38],
    labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 'Current'],
  },
  requests: {
    title: 'Outgoing carrier transmission rate',
    desc: 'Successful WhatsApp text, media, and template messages dispatched per second across Kenyan corporate clients.',
    unit: 'msg/s',
    points: [88, 112, 105, 142, 195, 230, 212, 222, 240, 254, 268],
    labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 'Current'],
  },
};

export default function TelemetryChart() {
  const [telemetryMetric, setTelemetryMetric] = useState<'latency' | 'memory' | 'requests'>('latency');
  const selectedMetric = metricConfig[telemetryMetric];
  const maxVal = Math.max(...selectedMetric.points);

  return (
    <div className="space-y-6 bg-white border border-[#e1e9e5]/80 rounded-3xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#15803d] font-bold">Real-Time Node Monitors</span>
          <h3 className="text-sm font-bold text-forest-deep mt-1">{selectedMetric.title}</h3>
          <p className="text-xs text-graphite mt-1 max-w-xl">{selectedMetric.desc}</p>
        </div>

        {/* Metric Selector pills */}
        <div className="inline-flex p-1 bg-[#10231d]/5 rounded-xl border border-[#d2e2db]">
          {(['latency', 'memory', 'requests'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setTelemetryMetric(metric)}
              className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                telemetryMetric === metric ? 'bg-white text-emerald-950 shadow-sm' : 'text-[#485e54] hover:text-emerald-950'
              }`}
            >
              {metric === 'latency' ? 'Latency' : metric === 'memory' ? 'RAM Lease' : 'Send Rate'}
            </button>
          ))}
        </div>
      </div>

      {/* AREA CHART */}
      <div className="relative pt-6">
        <div className="absolute right-4 top-4 font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 z-10">
          Peak: {maxVal} {selectedMetric.unit}
        </div>

        <div className="w-full bg-stone-50 rounded-[20px] h-[260px] relative border border-[#e1e9e5]/80 flex items-end p-2 pb-6">
          <svg className="w-full h-full absolute inset-0 pt-8 px-8" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradientEmerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <line x1="0" y1="50" x2="1000" y2="50" stroke="#f1f5f3" strokeDasharray="3,3" strokeWidth="1" />
            <line x1="0" y1="100" x2="1000" y2="100" stroke="#f1f5f3" strokeDasharray="3,3" strokeWidth="1" />
            <line x1="0" y1="150" x2="1000" y2="150" stroke="#f1f5f3" strokeDasharray="3,3" strokeWidth="1" />

            <motion.path
              key={`line-${telemetryMetric}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              d={`M ${selectedMetric.points.map((pt, i) => `${(i * 1000) / (selectedMetric.points.length - 1)} ${200 - (pt / maxVal) * 140}`).join(' L ')}`}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
            />

            <motion.path
              key={`area-${telemetryMetric}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              d={`M 0 200 L ${selectedMetric.points.map((pt, i) => `${(i * 1000) / (selectedMetric.points.length - 1)} ${200 - (pt / maxVal) * 140}`).join(' L ')} L 1000 200 Z`}
              fill="url(#chartGradientEmerald)"
            />

            {selectedMetric.points.map((pt, i) => (
              <circle
                key={`${telemetryMetric}-dot-${i}`}
                cx={(i * 1000) / (selectedMetric.points.length - 1)}
                cy={200 - (pt / maxVal) * 140}
                r="4"
                fill="#ffffff"
                stroke="#059669"
                strokeWidth="1.5"
              />
            ))}
          </svg>

          <div className="w-full flex justify-between px-8 text-[9px] font-mono text-[#556c60] absolute bottom-1.5 left-0 right-0">
            {selectedMetric.labels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-[18px]">
        <h4 className="text-xs font-bold text-forest-deep flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-700" />
          Direct Outbox Stream Optimization Analyzer
        </h4>
        <p className="text-[11px] text-[#4d665a] leading-relaxed mt-1">
          Active WhatsApp dispatch nodes are dynamically rate-limited to 3-6 messages per second to fully comply with carrier anti-spam regulations in Nairobi. Peak transaction pipelines are handled by redundant socket groups to bypass queue bottlenecks.
        </p>
      </div>
    </div>
  );
}