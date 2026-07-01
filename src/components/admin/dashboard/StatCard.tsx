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
  iconBgClass = 'bg-[#2d2813]',
  iconColor = 'text-[#eab308]',
  cardBgClass = 'bg-[#181711]',
  cardBorderClass = 'border-[#2d2813]',
  cardContentClass = 'text-[#6e684a]',
  valueColor = 'text-white',
  trendColor = 'text-[#eab308]',
  chartData = [],
  chartBarClass = 'bg-[#2d2813]',
}: StatCardProps) {
  return (
    <div className={`${cardBgClass} border ${cardBorderClass} p-5 rounded-2xl shadow-sm flex flex-col justify-between relative group`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold tracking-wide">
          <span className="text-[#6e684a]">{label}</span>
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
              className={`flex-1 rounded-t ${chartBarClass} group-hover:bg-[#3d3a1e] transition-colors`}
              style={{ height: `${Math.max(val, 4)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
