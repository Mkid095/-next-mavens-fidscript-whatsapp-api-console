import React, { useState } from 'react';
import { SystemLog } from '../types';
import { Search, Info, CheckCircle2, ShieldAlert, FileText, Download, Filter, BarChart3, LineChart, Cpu, RefreshCw, Layers, Sparkles, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogsAndAnalyticsViewProps {
  logs: SystemLog[];
  onAddLog: (message: string, source: string, level: SystemLog['level']) => void;
}

export default function LogsAndAnalyticsView({ logs, onAddLog }: LogsAndAnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState<'stream' | 'telemetry'>('stream');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form block for testing logs injection
  const [newMsg, setNewMsg] = useState('');
  const [newSrc, setNewSrc] = useState('Nairobi API Router');
  const [newLvl, setNewLvl] = useState<SystemLog['level']>('INFO');

  // Trigger custom log entry for user satisfaction
  const handleSimulateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    onAddLog(newMsg, newSrc, newLvl);
    setNewMsg('');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Filter logs
  const filteredLogs = logs.filter((l) => {
    const matchesLevel = levelFilter === 'ALL' || l.level === levelFilter;
    const matchesQuery = 
      l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesQuery;
  });

  // Evolution WhatsApp server metrics (custom crisp SVG plots with modern emerald thematic values)
  const [telemetryMetric, setTelemetryMetric] = useState<'latency' | 'memory' | 'requests'>('latency');
  
  const metricConfig = {
    latency: {
      title: 'WhatsApp message dispatch latency',
      desc: 'Average delivery execution time from tenant HTTPS rest endpoint trigger to Safaricom carrier packet acknowledgment.',
      unit: 'ms',
      points: [34, 48, 32, 29, 21, 15, 6, 4, 3, 2.5, 1.8],
      labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 'Current'],
      color: 'stroke-emerald-600',
      gradient: 'from-emerald-500/10 to-transparent',
    },
    memory: {
      title: 'Isolated WhatsApp multi-device container RAM pool',
      desc: 'Aggregated RAM memory lease allocated to active virtual devices on Nairobi local clusters.',
      unit: '%',
      points: [14, 18, 25, 34, 42, 51, 44, 42, 40, 39, 38],
      labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 'Current'],
      color: 'stroke-emerald-500',
      gradient: 'from-emerald-500/10 to-transparent',
    },
    requests: {
      title: 'Outgoing carrier transmission rate',
      desc: 'Successful WhatsApp text, media, and template messages dispatched per second across Kenyan corporate clients.',
      unit: 'msg/s',
      points: [88, 112, 105, 142, 195, 230, 212, 222, 240, 254, 268],
      labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 'Current'],
      color: 'stroke-emerald-400',
      gradient: 'from-emerald-400/10 to-transparent',
    }
  };

  const selectedMetric = metricConfig[telemetryMetric];
  const maxVal = Math.max(...selectedMetric.points);

  return (
    <div className="space-y-6">
      
      {/* Tab select layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#e1e9e5] pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-forest-deep">
            Telemetry & Security Audit Trail
          </h1>
          <p className="text-xs text-graphite mt-1">
            Track message throughput latency anomalies and inspect incoming Safaricom hook socket dispatches.
          </p>
        </div>

        {/* Custom Green Switcher */}
        <div className="inline-flex p-1 bg-[#10231d]/5 rounded-xl border border-[#d2e2db] select-none self-start md:self-auto">
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'stream'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-[#4d665a] hover:text-[#0b1c14]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Raw Logs Stream</span>
          </button>
          
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'telemetry'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-[#4d665a] hover:text-[#0b1c14]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Cluster Analytics</span>
          </button>
        </div>
      </div>

      {activeTab === 'stream' ? (
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
                <span className="uppercase tracking-wider text-[9px]">
                  Evolution Process Output Stream
                </span>
                <span>East Africa Standard Time active</span>
              </div>

              <div className="divide-y divide-stone-100 max-h-[480px] overflow-y-auto bg-white p-1">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const isErr = log.level === 'ERROR';
                    const isWarn = log.level === 'WARNING';
                    const isSuccess = log.level === 'SUCCESS';
                    return (
                      <div
                        key={log.id}
                        className={`p-3 transition-colors ${
                          isErr ? 'bg-rose-500/[0.02]' : isWarn ? 'bg-amber-500/[0.02]' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              isSuccess
                                ? 'bg-emerald-500 animate-pulse'
                                : isWarn
                                ? 'bg-amber-400'
                                : isErr
                                ? 'bg-rose-500'
                                : 'bg-emerald-300'
                            }`}
                          />

                          <div className="flex-1 space-y-1 text-[#22332a]">
                            <div className="flex items-center justify-between text-[10px] text-[#6d8a7c] font-bold">
                              <span>HOST // {log.source.toUpperCase()}</span>
                              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="font-sans font-medium text-xs text-[#0a1812] leading-relaxed">
                              {log.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-[#738a7e]">
                    No telemetry messages match your filters.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right: Simulate telemetry alert injection */}
          <div className="bg-white border border-[#e1e9e5]/80 rounded-3xl shadow-sm p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-forest-deep">
                Telemetry Log Emulator
              </h3>
              <p className="text-xs text-graphite mt-1">
                Trigger simulated warnings or successful WhatsApp instance hook callbacks.
              </p>
            </div>

            <form onSubmit={handleSimulateLog} className="space-y-4 text-xs font-semibold text-[#0b1c14]">
              <div>
                <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1">
                  Event Source Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M-Pesa Hook Router"
                  value={newSrc}
                  onChange={(e) => setNewSrc(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#dee9e4] text-[#0f241d] rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1">
                  Alert Severity Level
                </label>
                <select
                  value={newLvl}
                  onChange={(e) => setNewLvl(e.target.value as SystemLog['level'])}
                  className="w-full px-3 py-2 border border-[#dee9e4] text-[#0f241d] bg-white rounded-xl focus:outline-none text-xs"
                >
                  <option value="INFO">INFO (Trace Message)</option>
                  <option value="SUCCESS">SUCCESS (Carrier Route OK)</option>
                  <option value="WARNING">WARNING (High Queue Delay)</option>
                  <option value="ERROR">ERROR (Daraja Handshake Broken)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1">
                  Log Alert Message payload
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the carrier connection status..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#dee9e4] text-[#0f241d] bg-white rounded-xl focus:outline-none text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-forest-deep text-white font-bold rounded-xl text-xs hover:bg-[#0c2e21] transition-all"
              >
                Incorporate Operational Alert
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Telemetry Section: Beautiful Emerald Green charts */
        <div className="space-y-6 bg-white border border-[#e1e9e5]/80 rounded-3xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#15803d] font-bold">
                Real-Time Node Monitors
              </span>
              <h3 className="text-sm font-bold text-forest-deep mt-1">
                {selectedMetric.title}
              </h3>
              <p className="text-xs text-graphite mt-1 max-w-xl">
                {selectedMetric.desc}
              </p>
            </div>

            {/* Metric Selector pills */}
            <div className="inline-flex p-1 bg-[#10231d]/5 rounded-xl border border-[#d2e2db]">
              <button
                onClick={() => setTelemetryMetric('latency')}
                className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                  telemetryMetric === 'latency' ? 'bg-white text-emerald-950 shadow-sm' : 'text-[#485e54] hover:text-emerald-950'
                }`}
              >
                Latency
              </button>
              
              <button
                onClick={() => setTelemetryMetric('memory')}
                className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                  telemetryMetric === 'memory' ? 'bg-white text-emerald-950 shadow-sm' : 'text-[#485e54] hover:text-emerald-950'
                }`}
              >
                RAM Lease
              </button>

              <button
                onClick={() => setTelemetryMetric('requests')}
                className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${
                  telemetryMetric === 'requests' ? 'bg-white text-emerald-950 shadow-sm' : 'text-[#485e54] hover:text-emerald-950'
                }`}
              >
                Send Rate
              </button>
            </div>
          </div>

          {/* AREA CHART */}
          <div className="relative pt-6">
            <div className="absolute right-4 top-4 font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 z-10">
              Peak: {maxVal} {selectedMetric.unit}
            </div>

            <div className="w-full bg-stone-50 rounded-[20px] h-[260px] relative border border-[#e1e9e5]/80 flex items-end p-2 pb-6">
              <svg className="w-full h-full absolute inset-0 pt-8 px-8" viewBox="0 0 1000 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradientEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Guidelines */}
                <line x1="0" y1="50" x2="1000" y2="50" stroke="#f1f5f3" strokeDasharray="3,3" strokeWidth="1" />
                <line x1="0" y1="100" x2="1000" y2="100" stroke="#f1f5f3" strokeDasharray="3,3" strokeWidth="1" />
                <line x1="0" y1="150" x2="1000" y2="150" stroke="#f1f5f3" strokeDasharray="3,3" strokeWidth="1" />

                {/* Plot line */}
                <motion.path
                  key={`line-${telemetryMetric}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  d={`M ${selectedMetric.points.map((pt, i) => `${(i * 1000) / (selectedMetric.points.length - 1)} ${200 - (pt / maxVal) * 140}`).join(' L ')}`}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                />

                {/* Area background */}
                <motion.path
                  key={`area-${telemetryMetric}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  d={`M 0 200 L ${selectedMetric.points.map((pt, i) => `${(i * 1000) / (selectedMetric.points.length - 1)} ${200 - (pt / maxVal) * 140}`).join(' L ')} L 1000 200 Z`}
                  fill="url(#chartGradientEmerald)"
                />

                {/* Joints */}
                {selectedMetric.points.map((pt, i) => (
                  <circle
                    key={`${telemetryMetric}-dot-${i}`}
                    cx={(i * 1000) / (selectedMetric.points.length - 1)}
                    cy={200 - (pt / maxVal) * 140}
                    r="4"
                    fill="#ffffff"
                    stroke="#059669"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>

              {/* Axis labels */}
              <div className="w-full flex justify-between px-8 text-[9px] font-mono text-[#556c60] absolute bottom-1.5 left-0 right-0">
                {selectedMetric.labels.map((lbl, idx) => (
                  <span key={idx}>{lbl}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-[18px]">
            <h4 className="text-xs font-bold text-forest-deep flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              Direct Outbox Stream Optimization Analyzer
            </h4>
            <p className="text-[11px] text-[#4d665a] leading-relaxed mt-1">
              Active WhatsApp dispatch nodes are dynamically rate-limited to 3-6 messages per second to fully comply with carrier anti-spam regulations in Nairobi. Peak transaction pipelines are handled by redundant socket groups to bypass queue bottlenecks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
