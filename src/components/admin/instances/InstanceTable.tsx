import React from 'react';
import { Instance } from '../../../services/api';
import { Smartphone, CheckCircle, RefreshCw, AlertTriangle, Wifi, WifiOff, QrCode, Trash2, Unlink, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface InstanceTableProps {
  instances: Instance[];
  onQrConnect: (name: string) => void;
  onDisconnect: (name: string) => void;
  onDelete: (name: string) => void;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'connected':
      return 'bg-green-900/40 text-green-400 border-green-800/50';
    case 'connecting':
      return 'bg-yellow-900/40 text-yellow-500 border-yellow-700/50';
    case 'disconnected':
      return 'bg-red-900/40 text-red-400 border-red-800/40';
    case 'error':
      return 'bg-red-900/40 text-red-400 border-red-800/40';
    default:
      return 'bg-[#2d2813] text-[#6e684a] border-[#3d3a1e]';
  }
}

function getStatusIcon(status: string): React.ReactNode {
  switch (status) {
    case 'connected':
      return <Wifi className="w-3 h-3" />;
    case 'connecting':
      return <RefreshCw className="w-3 h-3 animate-spin" />;
    case 'error':
      return <AlertTriangle className="w-3 h-3" />;
    default:
      return <WifiOff className="w-3 h-3" />;
  }
}

export default function InstanceTable({ instances, onQrConnect, onDisconnect, onDelete }: InstanceTableProps) {
  if (instances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-[#2d2813] flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-[#6e684a]" />
        </div>
        <p className="text-[#a8a99e] font-bold text-sm">No containers found</p>
        <p className="text-[#6e684a] text-xs">Containers will appear here once clients create them.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Mobile-first card view */}
      <div className="block md:hidden space-y-3">
        {instances.map((inst) => (
          <motion.div
            key={inst.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="font-bold text-[#a8a99e] text-sm">{inst.display_name || inst.name}</p>
                  <p className="text-[9px] text-[#6e684a] font-mono">{inst.name}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(inst.status)}`}>
                {getStatusIcon(inst.status)}
                {inst.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-2">
                <p className="text-[10px] text-[#6e684a]">Client</p>
                <p className="text-[10px] text-[#a8a99e] font-bold truncate">{inst.client_name || '—'}</p>
              </div>
              <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-2">
                <p className="text-[10px] text-[#6e684a]">Phone</p>
                <p className="text-[10px] text-[#a8a99e] font-mono truncate">{inst.phone_number || '—'}</p>
              </div>
              <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-2">
                <p className="text-[10px] text-[#6e684a]">Messages</p>
                <p className="text-[10px] text-[#a8a99e] font-bold">{(inst.total_messages || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {inst.status === 'disconnected' && (
                <button
                  onClick={() => onQrConnect(inst.name)}
                  className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" /> Connect
                </button>
              )}
              {inst.status === 'connected' && (
                <button
                  onClick={() => onDisconnect(inst.name)}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Unlink className="w-3.5 h-3.5" /> Disconnect
                </button>
              )}
              <button
                onClick={() => onDelete(inst.name)}
                className="py-2 px-3 bg-[#2d2813] hover:bg-red-900/30 text-red-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-[#2d2813] hover:border-red-800/40 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-[#2d2813]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#1a1915] border-b border-[#2d2813]">
              <th className="text-left px-4 py-3.5 font-bold text-[#6e684a] uppercase tracking-wider text-[10px]">Container</th>
              <th className="text-left px-4 py-3.5 font-bold text-[#6e684a] uppercase tracking-wider text-[10px]">Client</th>
              <th className="text-left px-4 py-3.5 font-bold text-[#6e684a] uppercase tracking-wider text-[10px]">Phone</th>
              <th className="text-left px-4 py-3.5 font-bold text-[#6e684a] uppercase tracking-wider text-[10px]">Status</th>
              <th className="text-left px-4 py-3.5 font-bold text-[#6e684a] uppercase tracking-wider text-[10px]">Messages</th>
              <th className="text-left px-4 py-3.5 font-bold text-[#6e684a] uppercase tracking-wider text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d2813]">
            {instances.map((inst) => (
              <tr key={inst.id} className="hover:bg-[#1f1d17] transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-bold text-[#a8a99e]">{inst.display_name || inst.name}</p>
                      <p className="text-[9px] text-[#6e684a] font-mono">{inst.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[#a8a99e]">{inst.client_name || '—'}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-[#6e684a] text-[11px]">{inst.phone_number || '—'}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(inst.status)}`}>
                    {getStatusIcon(inst.status)}
                    {inst.status.charAt(0).toUpperCase() + inst.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div>
                    <p className="font-bold text-[#a8a99e]">{(inst.total_messages || 0).toLocaleString()}</p>
                    <p className="text-[9px] text-[#6e684a]">total</p>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {inst.status === 'disconnected' && (
                      <button
                        onClick={() => onQrConnect(inst.name)}
                        className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 transition-colors"
                        title="Connect via QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                    {inst.status === 'connected' && (
                      <button
                        onClick={() => onDisconnect(inst.name)}
                        className="p-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/30 text-red-400 transition-colors"
                        title="Disconnect"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(inst.name)}
                      className="p-1.5 rounded-lg hover:bg-red-900/20 text-[#6e684a] hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
