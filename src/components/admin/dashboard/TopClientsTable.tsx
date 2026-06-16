import React from 'react';
import type { Client } from '../../../services/api';

interface TopClientsTableProps {
  clients: Client[];
}

export default function TopClientsTable({ clients }: TopClientsTableProps) {
  const topClients = [...clients]
    .sort((a, b) => b.total_messages - a.total_messages)
    .slice(0, 10);

  return (
    <div className="lg:col-span-2 bg-white border border-[#eaebe4] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-[#181711]">Top Clients by Volume</h3>
        <p className="text-xs text-stone-400 mt-0.5 mb-4">Ranked by total messages sent</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#eaebe4] text-stone-400 font-bold">
                <th className="pb-2 pr-4 text-[10px]">Client</th>
                <th className="pb-2 pr-4 text-[10px]">Plan</th>
                <th className="pb-2 pr-4 text-[10px] text-right">Total Msg</th>
                <th className="pb-2 text-[10px] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0eb]">
              {topClients.map((cli) => (
                <tr key={cli.id} className="hover:bg-[#f9f9f2] transition-colors">
                  <td className="py-2.5 pr-4 font-semibold text-[#181711]">{cli.name}</td>
                  <td className="py-2.5 pr-4 text-stone-500">{cli.plan_name || '—'}</td>
                  <td className="py-2.5 pr-4 text-right font-mono text-stone-600">{cli.total_messages.toLocaleString()}</td>
                  <td className="py-2.5 text-right">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                      cli.is_active === 1
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : 'bg-stone-100 text-stone-400'
                    }`}>
                      {cli.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
