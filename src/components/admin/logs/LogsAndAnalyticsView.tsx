import React, { useState } from 'react';
import { SystemLog } from '../../../types';
import { FileText, BarChart3 } from 'lucide-react';
import RequestLogsTable from './RequestLogsTable';
import TelemetryChart from './TelemetryChart';

interface LogsAndAnalyticsViewProps {
  logs: SystemLog[];
  onAddLog: (message: string, source: string, level: SystemLog['level']) => void;
}

export default function LogsAndAnalyticsView({ logs, onAddLog }: LogsAndAnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState<'stream' | 'telemetry'>('stream');

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
        <RequestLogsTable logs={logs} onAddLog={onAddLog} />
      ) : (
        <TelemetryChart />
      )}
    </div>
  );
}