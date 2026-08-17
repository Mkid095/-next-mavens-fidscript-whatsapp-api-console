import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import type { Instance } from '../../../services/api';

interface InstanceStatusCardProps {
  instances: Instance[];
}

export default function InstanceStatusCard({ instances }: InstanceStatusCardProps) {
  const connected = instances.filter(i => i.status === 'connected');
  const disconnected = instances.filter(i => i.status === 'disconnected');
  const connecting = instances.filter(i => i.status === 'connecting');

  return (
    <div className="bg-[#0b1613] text-white p-5 rounded-3xl border border-[#172d24] flex flex-col justify-between shadow-md">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instance Status</span>
          </h3>
          <span className="text-[10px] bg-[#12241e] border border-[#213f34] rounded-lg px-2 py-1 font-bold text-emerald-400">
            {connected.length} live
          </span>
        </div>
        <p className="text-[11px] text-[#6d8b7e]">
          WhatsApp instances currently connected to the platform.
        </p>
      </div>

      <div className="space-y-2 my-4">
        {instances.length === 0 ? (
          <p className="text-[11px] text-emerald-400 italic">No instances yet.</p>
        ) : (
          instances.slice(0, 6).map(inst => (
            <div key={inst.id} className="flex items-center justify-between p-2 bg-[#08100e] rounded-xl border border-[#132720]">
              <div className="flex items-center gap-2 min-w-0">
                {inst.status === 'connected' ? (
                  <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <WifiOff className="w-3 h-3 text-stone-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate">{inst.display_name || inst.name}</p>
                  <p className="text-[9px] text-stone-500 font-mono truncate">{inst.phone_number || '-'}</p>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                inst.status === 'connected'
                  ? 'bg-emerald-900 text-emerald-400 border border-emerald-700'
                  : inst.status === 'connecting'
                  ? 'bg-yellow-900 text-yellow-400 border border-yellow-700'
                  : 'bg-stone-800 text-stone-400 border border-stone-700'
              }`}>
                {inst.status}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between pt-2 text-[10px] text-stone-500">
        <span>{connected.length} connected</span>
        <span>{connecting.length} connecting</span>
        <span>{disconnected.length} offline</span>
      </div>
    </div>
  );
}
