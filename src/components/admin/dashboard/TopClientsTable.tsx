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
    <div className="lg:col-span-2 bg-[#181711] border border-[#2d2813] p-5 rounded-2xl flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-white">Top Clients by Volume</h3>
        <p className="text-xs text-[#6e684a] mt-0.5 mb-4">Ranked by total messages sent</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#2d2813] text-[#6e684a] font-bold">
                <th className="pb-2 pr-4 text-[10px]">Client</th>
                <th className="pb-2 pr-4 text-[10px]">Plan</th>
                <th className="pb-2 pr-4 text-[10px] text-right">Total Msg</th>
                <th className="pb-2 text-[10px] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2813]">
              {topClients.map((cli) => (
                <tr key={cli.id} className="hover:bg-[#1a1915] transition-colors">
                  <td className="py-2.5 pr-4 font-semibold text-white">{cli.name}</td>
                  <td className="py-2.5 pr-4 text-[#6e684a]">{cli.plan_name || '-'}</td>
                  <td className="py-2.5 pr-4 text-right font-mono text-[#a8a99e]">{cli.total_messages.toLocaleString()}</td>
                  <td className="py-2.5 text-right">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                      cli.is_active === 1
                        ? 'bg-[#2d2813] text-[#eab308] border border-[#3d3a1e]'
                        : 'bg-[#1a1915] text-[#6e684a] border border-[#2d2813]'
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
