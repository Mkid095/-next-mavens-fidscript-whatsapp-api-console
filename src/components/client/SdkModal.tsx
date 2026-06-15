import { Download, X } from 'lucide-react';
import { motion } from 'motion/react';
import { PUBLIC_API_BASE } from '../../data/apiEndpoints/index';

const SDKS = [
  { file: 'fidscript.js', label: 'JavaScript / TypeScript', desc: 'Browser & Node.js SDK' },
  { file: 'fidscript.py', label: 'Python', desc: 'Python 3 + requests' },
  { file: 'fidscript.php', label: 'PHP', desc: 'PHP 7.4+ with cURL' },
  { file: 'fidscript.go', label: 'Go', desc: 'Go 1.18+ with net/http' },
];

export default function SdkModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eaebe4]">
          <h4 className="font-bold text-sm">Download SDK</h4>
          <button onClick={onClose} className="text-stone-400 hover:text-black transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {SDKS.map((sdk) => (
            <button
              key={sdk.file}
              onClick={() => {
                window.open(`${PUBLIC_API_BASE}/sdk/${sdk.file}`, '_blank');
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#eaebe4] hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-purple-700">{sdk.label.split(' ')[0].slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-forest-deep">{sdk.label}</p>
                <p className="text-[10px] text-stone-500">{sdk.desc}</p>
              </div>
              <Download className="w-4 h-4 text-purple-400 group-hover:text-purple-700 transition-colors shrink-0" />
            </button>
          ))}
        </div>
        <div className="px-4 pb-4">
          <p className="text-[10px] text-stone-400 text-center">
            Or visit directly: <code className="text-[9px] font-mono">{PUBLIC_API_BASE}/sdk/</code>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
