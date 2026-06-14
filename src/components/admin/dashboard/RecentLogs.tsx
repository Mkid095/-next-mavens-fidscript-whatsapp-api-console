import React from 'react';
import { SystemLog } from '../../../types';

interface RecentLogsProps {
  logs: SystemLog[];
  onNavigate: (tab: string) => void;
  connectingCount: number;
}

export default function RecentLogs({ logs, onNavigate, connectingCount }: RecentLogsProps) {
  return (
    <div className="bg-white border border-[#e1e9e5]/80 p-5 rounded-3xl shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-[#cbd5e1]/40">
        <div>
          <h3 className="text-sm font-bold text-forest-deep">Connected Infrastructure Stream</h3>
          <p className="text-xs text-graphite">Live carrier audit logs synchronized across distributed containers</p>
        </div>
        <button onClick={() => onNavigate('Audit Logs')} className="text-xs text-emerald-700 hover:text-emerald-800 font-bold">
          Examine system logs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#415a4d]">Recent Activity Threads</div>
          <div className="space-y-1.5">
            {logs.slice(0, 3).map((log) => (
              <div key={log.id} className="text-xs bg-[#f8faf9] p-2 rounded-xl border border-[#e2e9e6] flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                  log.level === 'SUCCESS' ? 'bg-emerald-500' : 'bg-amber-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-graphite">{log.source}</p>
                  <p className="text-forest-deep truncate text-[11px]">{log.message}</p>
                </div>
                <span className="text-[9px] text-[#869b91] shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#415a4d]">Environmental Health Checks</div>
          <div className="p-3 bg-[#f8faf9] border border-[#e1e9e5] rounded-2xl flex flex-col justify-between h-[115px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-graphite font-bold">API Connection Health:</span>
              <span className="font-bold text-emerald-600">99.98% stable</span>
            </div>
            <div className="w-full bg-[#e3e9e5] h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[99.98%]" />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-graphite font-semibold">Active processing queues:</span>
              <span className="font-mono text-[#0f382b] font-bold">{connectingCount} in queue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
