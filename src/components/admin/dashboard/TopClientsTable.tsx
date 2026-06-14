import React from 'react';

interface ClientData {
  country: string;
  flag: string;
  factories: string;
  recycledText: string;
  isHigh: boolean;
  sparkline: number[];
  type: string;
  totalValue: string;
  color: string;
}

interface TopClientsTableProps {
  clients: ClientData[];
}

export default function TopClientsTable({ clients }: TopClientsTableProps) {
  return (
    <div className="lg:col-span-2 bg-white border border-[#e1e9e5]/80 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-forest-deep">Plastic/API Outbox Rates by Corporate Client</h3>
        <p className="text-xs text-graphite mb-4">Instance allocation and transaction performance across Kenyan corporations</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#cbd5e1]/40 text-graphite font-bold">
                <th className="pb-2">Corporate Client</th>
                <th className="pb-2">Connected Instances</th>
                <th className="pb-2">Success Rate</th>
                <th className="pb-2">Outgoing Trend</th>
                <th className="pb-2">Carrier Interface</th>
                <th className="pb-2 text-right">Processed Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {clients.map((reg, idx) => (
                <tr key={idx} className="group hover:bg-eco-bg/20 transition-colors">
                  <td className="py-3 font-semibold text-forest-deep flex items-center gap-1.5">
                    <span className="text-sm">{reg.flag}</span>
                    <span>{reg.country}</span>
                  </td>
                  <td className="py-3 font-mono text-[#556c60]">{reg.factories}</td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      reg.isHigh
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-rose-50 text-[#ef4444] border border-rose-100'
                    }`}>
                      {reg.recycledText}
                    </span>
                  </td>
                  <td className="py-3">
                    <svg className="w-20 h-5" viewBox="0 0 100 30">
                      <path
                        d={`M 0 ${30 - reg.sparkline[0]} L 16 ${30 - reg.sparkline[1]} L 32 ${30 - reg.sparkline[2]} L 48 ${30 - reg.sparkline[3]} L 64 ${30 - reg.sparkline[4]} L 80 ${30 - reg.sparkline[5]} L 100 ${30 - reg.sparkline[6]}`}
                        fill="none"
                        stroke={reg.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </td>
                  <td className="py-3 text-[#556a5e] font-medium">{reg.type}</td>
                  <td className="py-3 text-right font-mono text-[11px] font-bold text-forest-deep">{reg.totalValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
