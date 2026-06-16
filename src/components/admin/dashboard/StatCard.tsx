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
  iconBgClass = 'bg-[#f9f9f2]',
  iconColor = 'text-[#eab308]',
  cardBgClass = 'bg-white',
  cardBorderClass = 'border-[#eaebe4]',
  cardContentClass = 'text-stone-500',
  valueColor = 'text-[#181711]',
  trendColor = 'text-yellow-600',
  chartData = [],
  chartBarClass = 'bg-stone-100',
}: StatCardProps) {
  return (
    <div className={`${cardBgClass} border ${cardBorderClass} p-5 rounded-2xl shadow-sm flex flex-col justify-between relative group`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold tracking-wide">
          <span className="text-stone-500">{label}</span>
          <span className={`p-1.5 rounded-lg ${iconBgClass} ${iconColor}`}>
            {icon}
          </span>
        </div>
        <div className="space-y-1">
          <h3 className={`text-2xl font-bold ${valueColor} tracking-tight`}>{value}</h3>
          {trend && (
            <p className={`text-xs ${cardContentClass} flex items-center gap-1`}>
              <TrendingUp className={`w-3 h-3 ${trendColor}`} />
              <span className={`font-bold ${trendColor}`}>{trendValue}</span> {trend}
            </p>
          )}
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="pt-4 flex items-end gap-[3px] h-10">
          {chartData.map((val, idx) => (
            <div
              key={idx}
              className={`flex-1 rounded-t ${chartBarClass} group-hover:bg-yellow-100 transition-colors`}
              style={{ height: `${Math.max(val, 4)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
