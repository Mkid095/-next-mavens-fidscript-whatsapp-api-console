import { Calculator } from 'lucide-react';
import { MESSAGE_TYPES } from './constants.js';

interface CustomCalcProps {
  tokens: number;
  onTokens: (n: number) => void;
  cost: { total: number; perToken: number; label: string; displayTokens: number };
}

export default function CustomCalc({ tokens, onTokens, cost }: CustomCalcProps) {
  const presets = [100, 500, 1000, 2000];

  return (
    <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Calculator className="w-4 h-4 text-yellow-500 shrink-0" />
        <span className="text-xs font-bold text-[#cbd3cf]">Custom Token Calculator</span>
        <span className="ml-auto text-[9px] text-[#5a554a] shrink-0">KES {cost.perToken.toFixed(2)}/token</span>
      </div>

      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        {presets.map(v => (
          <button
            key={v}
            onClick={() => onTokens(v)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              tokens === v
                ? 'bg-yellow-500 text-[#181711]'
                : 'bg-[#2d2813] text-[#a8a99e] hover:bg-[#3d3a1e]'
            }`}
          >
            {v >= 1000 ? `${v / 1000}K` : v}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3">
        <input
          type="range" min={10} max={5000} step={10} value={tokens}
          onChange={e => onTokens(Number(e.target.value))}
          className="flex-1 accent-yellow-500 min-w-0"
        />
        <div className="relative w-28 shrink-0">
          <input
            type="number" min={10} max={999999} value={tokens}
            onChange={e => onTokens(Math.max(10, Number(e.target.value)))}
            className="w-full px-3 py-2 bg-[#1a1915] border border-[#2d2813] rounded-xl text-center text-sm font-bold text-[#cbd3cf] focus:outline-none focus:border-yellow-500 pr-8"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#5a554a]">tok</span>
        </div>
      </div>

      {/* Cost */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-3 text-center">
          <p className="text-lg font-black text-yellow-500">KES {cost.total.toLocaleString()}</p>
          <p className="text-[9px] text-[#5a554a]">Total cost</p>
        </div>
        <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-3 text-center">
          <p className="text-lg font-black text-green-400">{cost.displayTokens.toLocaleString()}</p>
          <p className="text-[9px] text-[#5a554a]">Tokens</p>
        </div>
      </div>

      {/* Message equivalents */}
      <div>
        <p className="text-[10px] font-bold text-[#6e684a] uppercase tracking-wide mb-2">What you can send</p>
        <div className="grid grid-cols-2 gap-2">
          {MESSAGE_TYPES.map(({ label, Icon, perMsg }) => (
            <div key={label} className="flex items-center gap-2 bg-[#1a1915] border border-[#2d2813] rounded-xl px-3 py-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#181711] flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-[#6e684a]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#cbd3cf] truncate">{Math.floor(tokens / perMsg).toLocaleString()}</p>
                <p className="text-[9px] text-[#5a554a]">{label.toLowerCase()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}