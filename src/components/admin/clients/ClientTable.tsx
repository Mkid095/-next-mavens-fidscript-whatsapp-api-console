import React from 'react';
import { Client } from '../../../services/api';
import { Mail, Phone, Calendar, Building, ToggleLeft, ToggleRight, Key, Trash2, Coins } from 'lucide-react';

interface ClientTableProps {
  clients: Client[];
  onToggleClient?: (id: string) => void;
  onResetKey?: (id: string) => void;
  onDeleteClient?: (id: string) => void;
  onAwardTokens?: (client: Client) => void;
  onViewClient?: (client: Client) => void;
}

export default function ClientTable({
  clients,
  onToggleClient,
  onResetKey,
  onDeleteClient,
  onAwardTokens,
  onViewClient,
}: ClientTableProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {clients.map((cli) => (
        <div
          key={cli.id}
          className="bg-white border border-[#eaebe4]/80 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
        >
          {/* Card header — clickable for detail view */}
          <button
            className="p-5 border-b border-[#eaebe4]/60 flex items-start justify-between gap-3 bg-[#f9f9f2] text-left w-full"
            onClick={() => onViewClient?.(cli)}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-yellow-600 shrink-0" />
                <h3 className="font-bold text-[#272c30] text-sm truncate">
                  {cli.name}
                </h3>
              </div>
              <p className="font-mono text-[9px] text-[#7d8071] uppercase tracking-wider">
                ID: {cli.id}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                cli.is_active === 1
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-stone-100 text-stone-500 border border-stone-200'
              }`}>
                {cli.is_active === 1 ? 'Active' : 'Inactive'}
              </span>
            </div>
          </button>

          {/* Card details */}
          <div className="p-5 space-y-3 text-xs text-[#525345] flex-1">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#8a8c80] shrink-0" />
              <span className="truncate font-medium">{cli.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#8a8c80] shrink-0" />
              <span className="font-mono">{cli.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#8a8c80] shrink-0" />
              <span className="text-[#6a6c5d]">Joined: {new Date(cli.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Card footer with actions */}
          <div className="p-4 border-t border-[#eaebe4]/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleClient?.(cli.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  cli.is_active === 1
                    ? 'text-emerald-600 hover:bg-emerald-50'
                    : 'text-stone-400 hover:bg-stone-50'
                }`}
                title={cli.is_active === 1 ? 'Disable client' : 'Enable client'}
              >
                {cli.is_active === 1 ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
              <button
                onClick={() => onResetKey?.(cli.id)}
                className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors"
                title="Reset API key"
              >
                <Key className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAwardTokens?.(cli)}
                className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition-colors"
                title="Award tokens"
              >
                <Coins className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteClient?.(cli.id)}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                title="Delete client"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#272c30]">{cli.total_messages.toLocaleString()}</p>
              <p className="text-[9px] text-[#7d8071]">messages sent</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
