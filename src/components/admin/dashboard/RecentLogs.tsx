import React from 'react';
import { SystemLog } from '../../../types';

interface RecentLogsProps {
  logs: SystemLog[];
  onNavigate: (tab: string) => void;
  connectingCount: number;
}

export default function RecentLogs({ logs, onNavigate, connectingCount }: RecentLogsProps) {
  return (
    <div className="bg-white border border-[#eaebe4] p-5 rounded-2xl shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-[#eaebe4]">
        <div>
          <h3 className="text-sm font-bold text-[#181711]">Recent API Activity</h3>
          <p className="text-xs text-stone-400 mt-0.5">Latest requests across all containers</p>
        </div>
        <button onClick={() => onNavigate('logs')} className="text-xs text-yellow-600 hover:text-yellow-700 font-semibold">
          View all logs →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent log entries */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Recent Requests</div>
          {logs.slice(0, 4).map((log) => (
            <div key={log.id} className="text-xs bg-[#f9f9f2] p-2.5 rounded-xl border border-[#eaebe4] flex items-start gap-2">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                log.level === 'SUCCESS' ? 'bg-yellow-500' : 'bg-amber-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-stone-400 truncate">{log.source}</p>
                <p className="text-[11px] font-medium text-[#181711] truncate">{log.message}</p>
              </div>
              <span className="text-[9px] text-stone-400 shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-xs text-stone-400 italic">No recent requests.</p>
          )}
        </div>

        {/* Health indicators */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">System Health</div>
          <div className="p-3 bg-[#f9f9f2] border border-[#eaebe4] rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-600">Processing queues:</span>
              <span className="font-bold text-[#181711]">{connectingCount} active</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-stone-500">System operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
