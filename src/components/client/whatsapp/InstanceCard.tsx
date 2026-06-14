import React from 'react';
import { QrCode, Link2, Link2Off, RefreshCw, Wifi, WifiOff, Trash2 } from 'lucide-react';
import type { Instance } from '../../../services/api';

interface InstanceCardProps {
  inst: Instance;
  onConnect: (inst: Instance, mode: 'qr' | 'code') => void;
  onDisconnect: (inst: Instance) => void;
  onDelete: (inst: Instance) => void;
}

export default function InstanceCard({ inst, onConnect, onDisconnect, onDelete }: InstanceCardProps) {
  const isConnected = inst.status === 'connected';
  const isConnecting = inst.status === 'connecting';

  return (
    <div className="bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-yellow-800 font-bold">Container</span>
          <h4 className="text-base font-bold text-forest-deep font-mono">{inst.name}</h4>
          <div className="text-[11px] text-[#6a6c5d] flex items-center gap-1">
            {isConnected ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-stone-400" />}
            <code className="font-mono bg-[#eaebe4] px-1 py-0.5 rounded text-xs">{inst.phone_number || '—'}</code>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
          isConnected ? 'bg-green-100 text-green-800 border border-green-200' :
          isConnecting ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
          'bg-red-100 text-red-600 border border-red-100'
        }`}>
          {inst.status}
        </span>
      </div>
      <div className="pt-3 border-t border-[#eaebe4] flex items-center justify-between mt-4">
        <span className="text-[10px] text-stone-400 font-semibold">
          {inst.last_active ? `Active: ${new Date(inst.last_active).toLocaleDateString()}` : 'Never active'}
        </span>
        <div className="flex items-center gap-1.5">
          {!isConnected && !isConnecting && (
            <>
              <button
                onClick={() => onConnect(inst, 'qr')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1"
              >
                <QrCode className="w-3 h-3" /> QR
              </button>
              <button
                onClick={() => onConnect(inst, 'code')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Link2 className="w-3 h-3" /> Code
              </button>
            </>
          )}
          {isConnecting && (
            <button onClick={() => onConnect(inst, 'qr')} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}
          {isConnected && (
            <button onClick={() => onDisconnect(inst)} className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              <Link2Off className="w-3 h-3" /> Disconnect
            </button>
          )}
          <button
            onClick={() => onDelete(inst)}
            className="text-stone-400 hover:text-red-700 p-1.5 bg-white border border-stone-200 hover:border-red-200 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
