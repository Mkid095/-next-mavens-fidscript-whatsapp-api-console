import React, { useState } from 'react';
import { Instance, Client, SystemLog } from '../types';
import { 
  Activity, 
  Users, 
  ShieldAlert, 
  Cpu, 
  Sparkles, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Globe, 
  ChevronDown, 
  HelpCircle, 
  Leaf, 
  Award,
  Zap,
  Flame,
  Wrench,
  CheckCircle,
  Clock,
  MessageCircle,
  PhoneCall,
  Database,
  Smartphone,
  Signal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardOverviewProps {
  instances: Instance[];
  clients: Client[];
  logs: SystemLog[];
  onNavigate: (tab: string) => void;
  userEmail?: string;
}

export default function DashboardOverview({
  instances,
  clients,
  logs,
  onNavigate,
  userEmail = 'kennedygithinjioffice@gmail.com',
}: DashboardOverviewProps) {
  const [selectedMapRegion, setSelectedMapRegion] = useState('Nairobi');
  const [selectedCountry, setSelectedCountry] = useState<string | null>('Nairobi HQ');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // States derived from live system data
  const activeClusters = instances.filter((i) => i.status === 'Connected').length;
  const connectingCount = instances.filter((i) => i.status === 'Connecting').length;

  // Nairobi Outbox Pipeline Rate (Weekly regional API dispatch peak tracker)
  const cciBars = [
    { week: 'W1', value: 45, active: false },
    { week: 'W2', value: 52, active: false },
    { week: 'W3', value: 48, active: false },
    { week: 'W4', value: 58, active: false },
    { week: 'W5', value: 66, active: false },
    { week: 'W6', value: 74, active: false },
    { week: 'W7', value: 60, active: false },
    { week: 'W8', value: 85.4, active: true }, // Peak Point
    { week: 'W9', value: 70, active: false },
    { week: 'W10', value: 65, active: false },
    { week: 'W11', value: 78, active: false },
    { week: 'W12', value: 73, active: false },
    { week: 'W13', value: 66, active: false },
    { week: 'W14', value: 55, active: false },
    { week: 'W15', value: 62, active: false },
  ];

  // Client volumes with active Kenyan corporate partners
  const regionRecyclingData = [
    {
      country: 'Safaricom PLC',
      flag: '🟢',
      factories: '42 instances',
      recycledText: '99.98%',
      isHigh: true,
      sparkline: [80, 95, 92, 98, 99, 99.9, 99.98],
      type: 'Daraja B2C Direct',
      totalValue: '8,412,987 dispatches',
      color: '#10b981',
    },
    {
      country: 'Equity Bank Kenya',
      flag: '🟤',
      factories: '28 instances',
      recycledText: '99.95%',
      isHigh: true,
      sparkline: [90, 93, 95, 94, 98, 97, 99.95],
      type: 'One-Time OTP',
      totalValue: '5,912,410 dispatches',
      color: '#059669',
    },
    {
      country: 'Carrefour Kenya',
      flag: '🔵',
      factories: '14 instances',
      recycledText: '99.20%',
      isHigh: true,
      sparkline: [70, 80, 85, 80, 88, 90, 99.20],
      type: 'Loyalty Promo',
      totalValue: '2,014,350 dispatches',
      color: '#059669',
    },
    {
      country: 'KCB Bank Limited',
      flag: '🟡',
      factories: '35 instances',
      recycledText: '98.50%',
      isHigh: false,
      sparkline: [60, 70, 75, 70, 85, 82, 98.50],
      type: 'Statements Core',
      totalValue: '4,419,005 dispatches',
      color: '#eab308',
    },
  ];

  // Kenyan WhatsApp API carrier distributors mapping
  const mapCountries = [
    { name: 'Nairobi HQ', x: '58%', y: '42%', value: '99.98%', status: 'Safaricom Core', color: 'bg-emerald-500' },
    { name: 'Mombasa Port', x: '35%', y: '45%', value: '98.40%', status: 'Coastal Node', color: 'bg-teal-500' },
    { name: 'Kisumu Hub', x: '22%', y: '58%', value: '97.60%', status: 'Lake Victoria Relay', color: 'bg-emerald-400' },
    { name: 'Nakuru Central', x: '47%', y: '38%', value: '99.10%', status: 'Rift Valley Node', color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">

      {/* Interactive Quick Alert Bar */}
      <div className="bg-[#122b22] border border-[#1d4739] text-[#bbf7d0] px-4 py-3.5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm shadow-[#0a1813]">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-[#1d4739] text-[#10b981] rounded-lg">
            <Signal className="w-3.5 h-3.5" />
          </span>
          <span>
            FIDScript Multi-instance terminal synchronized for administrator <strong>Kennedy</strong> under <code className="font-mono text-emerald-300 bg-emerald-950 px-1 py-0.5 rounded">{userEmail}</code>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {activeClusters} WhatsApp Instances Online
          </span>
          <span className="text-[#89a296]">|</span>
          <button 
            onClick={() => onNavigate('Audit Logs')}
            className="underline hover:text-white transition-colors"
          >
            Review audit trail
          </button>
        </div>
      </div>

      {/* Row of 3 KPI Cards exactly same as design screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Active WhatsApp Dispatched Messages */}
        <div className="bg-[#0b1b16] text-[#cbd3cf] p-5 rounded-3xl border border-[#18392f] shadow-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#6e9686] font-semibold tracking-wide">
              <span>Daily Dispatched Messages</span>
              <span className="p-1 bg-[#102e24] text-emerald-400 rounded-lg">
                <MessageCircle className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-white tracking-tight">204,502 msgs</h3>
              <p className="text-xs text-[#4f7b6b] flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-bold">+18.3%</span> volume trigger today
              </p>
            </div>
          </div>

          <div className="pt-5 flex items-end gap-[3px] h-11">
            {[35, 45, 60, 50, 75, 40, 65, 80, 50, 68, 85, 95].map((val, idx) => (
              <div 
                key={idx} 
                className="flex-1 rounded-t bg-[#0c3124] group-hover:bg-[#124d38] transition-colors"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
        </div>

        {/* Card 2: API Gateway Success Uptime */}
        <div className="bg-white border border-[#e1e9e5]/80 p-5 rounded-3xl shadow-sm flex flex-col justify-between relative group">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-graphite font-semibold tracking-wide">
              <span>Gateway Delivery Success</span>
              <span className="p-1 bg-emerald-100 text-emerald-800 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-forest-deep tracking-tight">99.98 / 100</h3>
              <p className="text-xs text-graphite flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Stable uptime</span> across Kenyan networks
              </p>
            </div>
          </div>

          <div className="pt-5 flex items-end gap-[3px] h-11">
            {[95, 94, 98, 99, 99.9, 99.98, 99.95, 99.8, 99.9, 99.98, 99.95, 99.99].map((val, idx) => (
              <div 
                key={idx} 
                className="flex-1 rounded-t bg-stone-100 group-hover:bg-emerald-100 transition-all"
                style={{ height: `${(val - 90) * 10}%` }}
              />
            ))}
          </div>
        </div>

        {/* Card 3: Connected WhatsApp Instances */}
        <div className="bg-white border border-[#e1e9e5]/80 p-5 rounded-3xl shadow-sm flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-graphite font-semibold tracking-wide">
              <span>Premium Active Instances</span>
              <span className="p-1 bg-[#10231d]/5 text-[#10231d] rounded-lg">
                <Smartphone className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-forest-deep tracking-tight">{instances.length} / 50</h3>
              <p className="text-xs text-graphite flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-500 font-bold">+4 new</span> private subnets provisioned
              </p>
            </div>
          </div>

          <div className="pt-5 flex items-end gap-[3px] h-11">
            {[20, 35, 45, 30, 60, 55, 68, 72, 85, 90, 80, 95].map((val, idx) => (
              <div 
                key={idx} 
                className="flex-1 rounded-t bg-emerald-50 group-hover:bg-emerald-200 transition-colors"
                style={{ height: `${val}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Outbox Pipeline Rate (OPR) Barcode Chart & KES Yield indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* CCI Barcode Chart Panel - Left (Colspan 2) */}
        <div className="lg:col-span-2 bg-white border border-[#e1e9e5]/80 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-forest-deep">Outbox Pipeline Rate (OPR)</h3>
                <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Live Milliseconds Gateway</span>
              </div>
              <p className="text-xs text-graphite">Weekly message queue processing index on Nairobi carrier routes</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-xs font-bold bg-[#10231d]/5 hover:bg-[#10231d]/10 rounded-xl px-3 py-1.5 flex items-center gap-1 text-emerald-950">
                <span>Active 2 month stream</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="relative pt-6 pb-2">
            {/* Tooltip Overlay */}
            <div className="absolute top-0 left-[50%] transform -translate-x-[50%] z-10 bg-[#09110f] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 border border-[#1b2d26] shadow-md pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>85.4% Outbox Dispatch Efficiency Peak</span>
            </div>

            <div className="flex items-end justify-between gap-1 h-36 border-b border-dashed border-[#e2e8f0]">
              {cciBars.map((bar, idx) => (
                <div 
                  key={idx}
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div 
                    className={`w-full rounded-t transition-all ${
                      bar.active 
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' 
                        : hoveredBar === idx ? 'bg-[#0f402c]' : 'bg-[#15342a]/20'
                    }`}
                    style={{ height: `${bar.value}%` }}
                  />
                  <span className="text-[9px] font-bold mt-2 text-graphite group-hover:text-forest-deep transition-colors">
                    {bar.week}
                  </span>

                  {hoveredBar === idx && (
                    <div className="absolute bottom-full mb-1 bg-forest-deep text-white text-[9px] px-1.5 py-0.5 rounded font-mono pointer-events-none z-20">
                      {bar.value}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kenyan Shillings Generated & M-Pesa Hook summary card - Right (Colspan 1) */}
        <div className="bg-[#dcefe5] border border-[#bcdbc8] p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-[#1e583c] uppercase tracking-wider">FIDScript Billing Yield (KES)</p>
            
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-[#0e3c25] tracking-tight leading-none">KES 942,650</h2>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#185335]">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                <span>+24.5% direct M-Pesa automated subscription</span>
              </div>
            </div>

            <hr className="border-[#bddfc9]" />

            {/* Sub-metrics layout with circular bullets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#c8e2d4] flex items-center justify-center text-emerald-800">
                    <Database className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <p className="font-bold text-[#143625]">Daraja API Hook C2B</p>
                    <p className="text-[10px] text-[#4d7d65]">Safaricom Instant Callback</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-forest-deep">KES 540K</p>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded">Processed</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#c8e2d4] flex items-center justify-center text-emerald-800">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <p className="font-bold text-[#143625]">Corporate Bank Wire</p>
                    <p className="text-[10px] text-[#4d7d65]">Manual Invoices Settled</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-forest-deep">KES 402K</p>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded">Reconciled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row of Region recycling rates and Interactive Environmental Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Table representation: Corporate Client Outbox Metrics (Colspan 2) */}
        <div className="lg:col-span-2 bg-white border border-[#e1e9e5]/80 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-forest-deep">Plastic/API Outbox Rates by Corporate Client</h3>
            <p className="text-xs text-graphite mb-4">Instance allocation and transaction performance across Kenyan corporations</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#cbd5e1]/40 text-graphite font-bold">
                    <th className="pb-2">Corporate Client</th>
                    <th className="pb-2">Connected Instances</th>
                    <th className="pb-2">Success Rate</th>
                    <th className="pb-2">Outgoing Trend</th>
                    <th className="pb-2">Carrier Interface</th>
                    <th className="pb-2 text-right">Processed Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {regionRecyclingData.map((reg, idx) => (
                    <tr key={idx} className="group hover:bg-eco-bg/20 transition-colors">
                      <td className="py-3 font-semibold text-forest-deep flex items-center gap-1.5">
                        <span className="text-sm">{reg.flag}</span>
                        <span>{reg.country}</span>
                      </td>
                      <td className="py-3 font-mono text-[#556c60]">{reg.factories}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          reg.isHigh 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-[#ef4444] border border-rose-100'
                        }`}>
                          {reg.recycledText}
                        </span>
                      </td>
                      <td className="py-3">
                        {/* Custom sparkline using path */}
                        <svg className="w-20 h-5" viewBox="0 0 100 30">
                          <path
                            d={`M 0 ${30 - reg.sparkline[0]} L 16 ${30 - reg.sparkline[1]} L 32 ${30 - reg.sparkline[2]} L 48 ${30 - reg.sparkline[3]} L 64 ${30 - reg.sparkline[4]} L 80 ${30 - reg.sparkline[5]} L 100 ${30 - reg.sparkline[6]}`}
                            fill="none"
                            stroke={reg.color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </td>
                      <td className="py-3 text-[#556a5e] font-medium">{reg.type}</td>
                      <td className="py-3 text-right font-mono text-[11px] font-bold text-forest-deep">{reg.totalValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Global Pollution/Kenyan Node Interactive Map (Colspan 1) */}
        <div className="bg-[#0b1613] text-white p-5 rounded-3xl border border-[#172d24] flex flex-col justify-between relative shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kenyan Distriduted Nodes</span>
              </h3>
              
              {/* Custom selector dropdown */}
              <button 
                onClick={() => setSelectedMapRegion(selectedMapRegion === 'Nairobi' ? 'Mombasa' : 'Nairobi')}
                className="text-[10px] bg-[#12241e] border border-[#213f34] rounded-lg px-2 py-1 flex items-center gap-1 font-bold text-[#8bf7c2]"
              >
                <span>{selectedMapRegion}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            
            <p className="text-[11px] text-[#6d8b7e]">
              Selected regional hubs highlight carrier roundtrip latencies. Click pointer positions to drill-down feedback metrics.
            </p>
          </div>

          {/* Map Visual Stage */}
          <div className="relative h-44 my-4 bg-[#08100e] rounded-xl border border-[#132720] overflow-hidden flex items-center justify-center">
            
            {/* abstract landmass coordinates */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
              {/* Kenyan abstract shape */}
              <path d="M40 20 Q 80 15, 110 30 T 150 70 T 110 100 T 50 90 T 20 60 Z" fill="#10b981" />
              <path d="M40 80 Q 60 70, 75 90 T 110 110" fill="none" stroke="#059669" strokeWidth="1" />
            </svg>

            {/* Glowing Map Pointer Nodes */}
            {mapCountries.map((node, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCountry(node.name)}
                className={`absolute w-3 h-3 rounded-full ${node.color} flex items-center justify-center cursor-pointer focus:outline-none transition-transform hover:scale-125`}
                style={{ left: node.x, top: node.y }}
              >
                <span className="absolute inset-0 w-full h-full rounded-full bg-inherit animate-ping opacity-75" />
              </button>
            ))}

            {/* Hover Tooltip display exactly like image */}
            <AnimatePresence>
              {selectedCountry && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-3 left-3 bg-[#0f241d] border border-[#20493b] rounded-lg p-2 text-left z-10 text-[10px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="font-bold text-white uppercase">{selectedCountry}</p>
                  </div>
                  <p className="text-[9px] text-emerald-400 mt-0.5">
                    {mapCountries.find(m => m.name === selectedCountry)?.status || 'Operational'}: <strong>{mapCountries.find(m => m.name === selectedCountry)?.value || '99.98%'}</strong>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <span className="absolute top-2 right-2 text-[9px] font-bold text-stone-500 uppercase tracking-widest pointer-events-none">
              EAST AFRICA GRID
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button 
              onClick={() => setSelectedCountry(null)}
              className="text-stone-400 hover:text-white"
            >
              <HelpCircle className="w-4 h-4 text-[#436456]" />
            </button>
            <span className="text-[9px] font-mono font-medium text-[#446658]">
              Nairobi core node latency tracker
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Real-time Console Log stream & Live instances at footer */}
      <div className="bg-white border border-[#e1e9e5]/80 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#cbd5e1]/40">
          <div>
            <h3 className="text-sm font-bold text-forest-deep">Connected Infrastructure Stream</h3>
            <p className="text-xs text-graphite">Live carrier audit logs synchronized across distributed containers</p>
          </div>
          <button 
            onClick={() => onNavigate('Audit Logs')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold"
          >
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

    </div>
  );
}
