/**
 * MetricCard.tsx - single KPI card for the analytics dashboard.
 */
import { type ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  subValue?: string;
  icon?: ReactNode;
  accent?: 'yellow' | 'green' | 'blue' | 'red' | 'purple';
  loading?: boolean;
}

const ACCENT_COLORS = {
  yellow: 'border-yellow-500/30 from-yellow-900/20 to-amber-900/10',
  green:  'border-green-500/30 from-green-900/20 to-emerald-900/10',
  blue:   'border-blue-500/30 from-blue-900/20 to-indigo-900/10',
  red:    'border-red-500/30 from-red-900/20 to-orange-900/10',
  purple: 'border-purple-500/30 from-purple-900/20 to-violet-900/10',
};

const ICON_COLORS = {
  yellow: 'text-yellow-400',
  green:  'text-green-400',
  blue:   'text-blue-400',
  red:    'text-red-400',
  purple: 'text-purple-400',
};

export default function MetricCard({ label, value, subValue, icon, accent = 'yellow', loading }: MetricCardProps) {
  if (loading) {
    return (
      <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-4 animate-pulse">
        <div className="h-3 w-20 bg-[#2d2813] rounded mb-3" />
        <div className="h-8 w-24 bg-[#2d2813] rounded mb-1" />
        <div className="h-2 w-16 bg-[#2d2813] rounded" />
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${ACCENT_COLORS[accent]} border rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">{icon}</div>}
        <p className="text-[10px] font-bold text-[#6e684a] uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-black text-white font-mono tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subValue && <p className="text-[10px] text-[#6e684a] mt-1">{subValue}</p>}
    </div>
  );
}
