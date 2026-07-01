import { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';

const whatsappTokens = [
  { action: 'Text message', cost: '1 token' },
  { action: 'Media — image / video / document', cost: '2 tokens' },
  { action: 'Audio', cost: '2 tokens' },
  { action: 'Sticker', cost: '2 tokens' },
  { action: 'Location', cost: '1 token' },
  { action: 'Contact card', cost: '1 token' },
  { action: 'Reaction / emoji', cost: '1 token' },
  { action: 'Poll / list', cost: '1 token' },
];

const aiUnits = [
  { action: 'AI reply generated', cost: '10 units' },
  { action: 'Dataset search', cost: '2 units' },
  { action: 'Tool call', cost: '2 units' },
  { action: 'Knowledge / memory search', cost: '1 unit' },
  { action: 'Memory save', cost: '1 unit' },
];

export default function TokenCostGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#181711] border border-[#2d2813] p-5 rounded-2xl flex flex-col justify-between">
      <div>
        {/* Header — always visible, toggles expand */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#2d2813] flex items-center justify-center">
              <Calculator size={14} className="text-[#eab308]" />
            </span>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white">Platform Token Costs</h3>
              <p className="text-[10px] text-[#6e684a]">WhatsApp &amp; AI chatbot billing</p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp size={16} className="text-[#6e684a]" />
          ) : (
            <ChevronDown size={16} className="text-[#6e684a]" />
          )}
        </button>

        {expanded && (
          <>
            {/* Plan limits banner */}
            <div className="mb-4 p-2.5 bg-[#2d2813] rounded-xl border border-[#3d3a1e] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eab308] shrink-0" />
              <p className="text-[10px] text-[#a8a99e]">
                <span className="font-semibold text-white">Workspace plans:</span>{' '}
                Starter 5K units/mo · Growth 50K · Business 250K · Enterprise 10M
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* WhatsApp tokens */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6e684a] mb-2">
                  WhatsApp Messages
                </p>
                <div className="space-y-1">
                  {whatsappTokens.map((row) => (
                    <div
                      key={row.action}
                      className="flex items-center justify-between text-[11px] py-1 border-b border-[#2d2813] last:border-0"
                    >
                      <span className="text-[#a8a99e]">{row.action}</span>
                      <span className="font-mono font-bold text-[#eab308]">{row.cost}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI chatbot units */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6e684a] mb-2">
                  AI Chatbot Units
                </p>
                <div className="space-y-1">
                  {aiUnits.map((row) => (
                    <div
                      key={row.action}
                      className="flex items-center justify-between text-[11px] py-1 border-b border-[#2d2813] last:border-0"
                    >
                      <span className="text-[#a8a99e]">{row.action}</span>
                      <span className="font-mono font-bold text-[#eab308]">{row.cost}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-[#3d3a1e]">
                  <p className="text-[10px] text-[#6e684a]">
                    Token purchase rate:{' '}
                    <span className="text-white font-semibold">KSh 0.11 / token</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {!expanded && (
          <p className="text-[11px] text-[#6e684a]">
            WhatsApp messages from 1 token · AI chatbot replies from 10 units ·{' '}
            <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }} className="text-[#eab308] hover:underline font-semibold">
              View full cost guide →
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
