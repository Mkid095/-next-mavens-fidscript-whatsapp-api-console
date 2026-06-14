import React from 'react';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendValue?: string;
  icon: React.ReactNode;
  iconBgClass?: string;
  iconColor?: string;
  cardBgClass?: string;
  cardBorderClass?: string;
  cardContentClass?: string;
  valueColor?: string;
  trendColor?: string;
  chartData?: number[];
  chartBarClass?: string;
}

export default function StatCard({
  label,
  value,
  trend,
  trendValue,
  icon,
  iconBgClass = 'bg-emerald-100',
  iconColor = 'text-emerald-800',
  cardBgClass = 'bg-white',
  cardBorderClass = 'border-[#e1e9e5]/80',
  cardContentClass = 'text-graphite',
  valueColor = 'text-forest-deep',
  trendColor = 'text-emerald-600',
  chartData = [],
  chartBarClass = 'bg-stone-100',
}: StatCardProps) {
  return (
    <div className={`${cardBgClass} border ${cardBorderClass} p-5 rounded-3xl shadow-sm flex flex-col justify-between relative group`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-graphite font-semibold tracking-wide">
          <span>{label}</span>
          <span className={`p-1 ${iconBgClass} ${iconColor} rounded-lg`}>
            {icon}
          </span>
        </div>
        <div className="space-y-1">
          <h3 className={`text-3xl font-bold ${valueColor} tracking-tight`}>{value}</h3>
          {trend && (
            <p className={`text-xs ${cardContentClass} flex items-center gap-1`}>
              <TrendingUp className={`w-3 h-3 ${trendColor}`} />
              <span className={`font-bold ${trendColor}`}>{trendValue}</span> {trend}
            </p>
          )}
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="pt-5 flex items-end gap-[3px] h-11">
          {chartData.map((val, idx) => (
            <div
              key={idx}
              className={`flex-1 rounded-t ${chartBarClass} group-hover:bg-emerald-200 transition-colors`}
              style={{ height: `${val}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
