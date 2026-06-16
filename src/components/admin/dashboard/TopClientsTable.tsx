import React from 'react';
import type { Client } from '../../../services/api';

interface TopClientsTableProps {
  clients: Client[];
}

export default function TopClientsTable({ clients }: TopClientsTableProps) {
  // Top clients by total message volume
  const topClients = [...clients]
    .sort((a, b) => b.total_messages - a.total_messages)
    .slice(0, 10);

  return (
    <div className="lg:col-span-2 bg-white border border-[#e1e9e5]/80 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-forest-deep">Top Clients by Volume</h3>
        <p className="text-xs text-graphite mb-4">Ranked by total messages sent</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#cbd5e1]/40 text-graphite font-bold">
                <th className="pb-2">Client</th>
                <th className="pb-2">Plan</th>
                <th className="pb-2">Token Balance</th>
                <th className="pb-2">Total Messages</th>
                <th className="pb-2">Today</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {topClients.map((cli) => (
                <tr key={cli.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-3 font-semibold text-forest-deep">{cli.name}</td>
                  <td className="py-3 text-stone-500">{cli.plan_name || '—'}</td>
                  <td className="py-3 font-mono text-stone-600">{(cli as any).token_balance?.toLocaleString() ?? '—'}</td>
                  <td className="py-3 font-mono text-stone-600">{cli.total_messages.toLocaleString()}</td>
                  <td className="py-3 font-mono text-stone-500">{cli.msg_count_today.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                      cli.is_active === 1
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-stone-100 text-stone-500'
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
