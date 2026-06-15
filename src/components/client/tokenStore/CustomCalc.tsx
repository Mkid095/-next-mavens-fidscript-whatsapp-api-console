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
    <div className="bg-[#fafaf5] border border-[#eaebe4] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-yellow-600" />
        <span className="text-xs font-bold text-forest-deep">Custom Token Calculator</span>
        <span className="ml-auto text-[9px] text-stone-400">KES {cost.perToken.toFixed(2)}/token</span>
      </div>

      {/* Presets */}
      <div className="flex gap-2">
        {presets.map(v => (
          <button
            key={v}
            onClick={() => onTokens(v)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              tokens === v ? 'bg-forest-deep text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
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
          className="flex-1 accent-yellow-500"
        />
        <div className="relative w-28">
          <input
            type="number" min={10} max={999999} value={tokens}
            onChange={e => onTokens(Math.max(10, Number(e.target.value)))}
            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-center text-sm font-bold text-forest-deep focus:outline-none focus:border-yellow-500 pr-8"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-stone-400">tok</span>
        </div>
      </div>

      {/* Cost */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#eaebe4] rounded-xl p-3 text-center">
          <p className="text-lg font-black text-yellow-700">KES {cost.total.toLocaleString()}</p>
          <p className="text-[9px] text-stone-400">Total cost</p>
        </div>
        <div className="bg-white border border-[#eaebe4] rounded-xl p-3 text-center">
          <p className="text-lg font-black text-green-700">{cost.displayTokens.toLocaleString()}</p>
          <p className="text-[9px] text-stone-400">Tokens</p>
        </div>
      </div>

      {/* Message equivalents */}
      <div>
        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-2">What you can send</p>
        <div className="grid grid-cols-2 gap-2">
          {MESSAGE_TYPES.map(({ label, Icon, perMsg }) => (
            <div key={label} className="flex items-center gap-2 bg-white border border-[#eaebe4] rounded-xl px-3 py-2">
              <div className="w-7 h-7 rounded-lg bg-stone-50 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-stone-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-forest-deep">{Math.floor(tokens / perMsg).toLocaleString()}</p>
                <p className="text-[9px] text-stone-400">{label.toLowerCase()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
