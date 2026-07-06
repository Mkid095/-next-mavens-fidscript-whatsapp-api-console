import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, HelpCircle } from 'lucide-react';

interface MapNode {
  name: string;
  x: string;
  y: string;
  value: string;
  status: string;
  color: string;
}

interface KenyanNodesMapProps {
  nodes: MapNode[];
}

export default function KenyanNodesMap({ nodes }: KenyanNodesMapProps) {
  const [selectedRegion, setSelectedRegion] = useState('Nairobi');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  return (
    <div className="bg-[#0b1613] text-white p-5 rounded-3xl border border-[#172d24] flex flex-col justify-between relative shadow-md">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kenyan Distriduted Nodes</span>
          </h3>
          <button
            onClick={() => setSelectedRegion(selectedRegion === 'Nairobi' ? 'Mombasa' : 'Nairobi')}
            className="text-[10px] bg-[#12241e] border border-[#213f34] rounded-lg px-2 py-1 flex items-center gap-1 font-bold text-[#8bf7c2]"
          >
            <span>{selectedRegion}</span>
          </button>
        </div>
        <p className="text-[11px] text-[#6d8b7e]">
          Selected regional hubs highlight carrier roundtrip latencies. Click pointer positions to drill-down feedback metrics.
        </p>
      </div>

      <div className="relative h-44 my-4 bg-[#08100e] rounded-xl border border-[#132720] overflow-hidden flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 200 120">
          <path d="M40 20 Q 80 15, 110 30 T 150 70 T 110 100 T 50 90 T 20 60 Z" fill="#10b981" />
          <path d="M40 80 Q 60 70, 75 90 T 110 110" fill="none" stroke="#059669" strokeWidth="1" />
        </svg>

        {nodes.map((node, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCountry(node.name)}
            className={`absolute w-3 h-3 rounded-full ${node.color} flex items-center justify-center cursor-pointer focus:outline-none transition-transform hover:scale-125`}
            style={{ left: node.x, top: node.y }}
          >
            <span className="absolute inset-0 w-full h-full rounded-full bg-inherit animate-ping opacity-75" />
          </button>
        ))}

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
                {nodes.find((m) => m.name === selectedCountry)?.status || 'Operational'}:{' '}
                <strong>{nodes.find((m) => m.name === selectedCountry)?.value || '99.98%'}</strong>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <span className="absolute top-2 right-2 text-[9px] font-bold text-stone-500 uppercase tracking-widest pointer-events-none">
          EAST AFRICA GRID
        </span>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={() => setSelectedCountry(null)} className="text-stone-400 hover:text-white">
          <HelpCircle className="w-4 h-4 text-[#436456]" />
        </button>
        <span className="text-[9px] font-mono font-medium text-[#446658]">Nairobi core node latency tracker</span>
      </div>
    </div>
  );
}
