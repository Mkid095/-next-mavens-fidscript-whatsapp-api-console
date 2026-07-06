import React, { useState } from 'react';
import { SystemLog } from '../../../types';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface RequestLogsTableProps {
  logs: SystemLog[];
  onAddLog: (message: string, source: string, level: SystemLog['level']) => void;
}

// Single log entry row
const LogEntry = ({ log }: { log: SystemLog }) => {
  const dotStyle = { SUCCESS: 'bg-emerald-500 animate-pulse', WARNING: 'bg-amber-400', ERROR: 'bg-rose-500', INFO: 'bg-emerald-300' }[log.level];
  const bgStyle = log.level === 'ERROR' ? 'bg-rose-500/[0.02]' : log.level === 'WARNING' ? 'bg-amber-500/[0.02]' : '';
  return (
    <div className={`p-3 transition-colors ${bgStyle}`}>
      <div className="flex items-start gap-3">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotStyle}`} />
        <div className="flex-1 space-y-1 text-[#22332a]">
          <div className="flex items-center justify-between text-[10px] text-[#6d8a7c] font-bold">
            <span>HOST // {log.source.toUpperCase()}</span>
            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="font-sans font-medium text-xs text-[#0a1812] leading-relaxed">{log.message}</p>
        </div>
      </div>
    </div>
  );
};

// Simulator form for injecting test logs
const LogSimulator = ({ onAdd }: { onAdd: RequestLogsTableProps['onAddLog'] }) => {
  const [msg, setMsg] = useState('');
  const [src, setSrc] = useState('Nairobi API Router');
  const [lvl, setLvl] = useState<SystemLog['level']>('INFO');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!msg.trim()) return; onAdd(msg, src, lvl); setMsg(''); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-[#0b1c14]">
      <div>
        <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1">Event Source Identifier</label>
        <input type="text" required placeholder="e.g. M-Pesa Hook Router" value={src} onChange={(e) => setSrc(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-[#dee9e4] text-[#0f241d] rounded-xl focus:outline-none" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1">Alert Severity Level</label>
        <select value={lvl} onChange={(e) => setLvl(e.target.value as SystemLog['level'])} className="w-full px-3 py-2 border border-[#dee9e4] text-[#0f241d] bg-white rounded-xl focus:outline-none text-xs">
          <option value="INFO">INFO (Trace Message)</option><option value="SUCCESS">SUCCESS (Carrier Route OK)</option><option value="WARNING">WARNING (High Queue Delay)</option><option value="ERROR">ERROR (Daraja Handshake Broken)</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1">Log Alert Message payload</label>
        <textarea rows={3} required placeholder="Describe the carrier connection status..." value={msg} onChange={(e) => setMsg(e.target.value)} className="w-full px-3 py-2.5 border border-[#dee9e4] text-[#0f241d] bg-white rounded-xl focus:outline-none text-xs resize-none" />
      </div>
      <button type="submit" className="w-full py-2.5 bg-forest-deep text-white font-bold rounded-xl text-xs hover:bg-[#0c2e21] transition-all">Incorporate Operational Alert</button>
    </form>
  );
};

export default function RequestLogsTable({ logs, onAddLog }: RequestLogsTableProps) {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const filteredLogs = logs.filter((l) => {
    const matchesLevel = levelFilter === 'ALL' || l.level === levelFilter;
    const matchesQuery =
      l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesQuery;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Log stream */}
      <div className="lg:col-span-2 space-y-4">
        {/* Filter controls */}
        <div className="p-4 bg-white border border-[#e1e9e5]/80 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9b93]" />
            <input
              type="text"
              placeholder="Filter log contents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#f8faf9] border border-[#e1e9e5] text-[#0f241d] placeholder-[#8a9b93] text-xs rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#556c60]" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-[#e1e9e5] bg-white text-xs font-semibold text-[#0f241d] rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Levels</option>
              <option value="SUCCESS">Success Only</option>
              <option value="INFO">Info Only</option>
              <option value="WARNING">Warnings</option>
              <option value="ERROR">Errors</option>
            </select>

            <button
              onClick={handleRefresh}
              className="p-2 border border-[#dee8e3] hover:bg-[#edf5f1] rounded-xl text-[#465f51] transition-all"
              title="Force telemetry rebuild"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Terminal Console Log Stream */}
        <div className="bg-white border border-[#e1e9e5]/80 rounded-3xl shadow-sm overflow-hidden font-mono text-[11px]">
          <div className="bg-[#f8faf9] border-b border-[#e1e9e5]/80 px-4 py-2.5 flex items-center justify-between text-[#55695f] font-bold">
            <span className="uppercase tracking-wider text-[9px]">Gateway Process Output Stream</span>
            <span>East Africa Standard Time active</span>
          </div>

          <div className="divide-y divide-stone-100 max-h-[480px] overflow-y-auto bg-white p-1">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => <LogEntry key={log.id} log={log} />)
            ) : (
              <div className="py-12 text-center text-[#738a7e]">No telemetry messages match your filters.</div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Simulate telemetry alert injection */}
      <div className="bg-white border border-[#e1e9e5]/80 rounded-3xl shadow-sm p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-forest-deep">Telemetry Log Emulator</h3>
          <p className="text-xs text-graphite mt-1">Trigger simulated warnings or successful container hook callbacks.</p>
        </div>
        <LogSimulator onAdd={onAddLog} />
      </div>
    </div>
  );
}