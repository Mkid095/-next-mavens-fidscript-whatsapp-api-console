import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { adminApi, type TokenCost } from '../../../services/admin';

export default function TokenCostGuide() {
  const [expanded, setExpanded] = useState(false);
  const [costs, setCosts] = useState<TokenCost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expanded && costs.length === 0) {
      setLoading(true);
      adminApi.getTokenCosts().then(res => {
        if (res.success && res.data) setCosts(res.data);
      }).finally(() => setLoading(false));
    }
  }, [expanded]);

  const whatsappRows = [
    { action: 'Text message', cost: costs.find(c => c.action === 'whatsapp.text')?.tokenCost ?? 1 },
    { action: 'Media - image / video / document', cost: costs.find(c => c.action === 'whatsapp.media')?.tokenCost ?? 2 },
    { action: 'Audio', cost: costs.find(c => c.action === 'whatsapp.audio')?.tokenCost ?? 2 },
    { action: 'Sticker', cost: costs.find(c => c.action === 'whatsapp.sticker')?.tokenCost ?? 2 },
    { action: 'Location', cost: costs.find(c => c.action === 'whatsapp.location')?.tokenCost ?? 1 },
    { action: 'Contact card', cost: costs.find(c => c.action === 'whatsapp.contact')?.tokenCost ?? 1 },
    { action: 'Reaction / emoji', cost: costs.find(c => c.action === 'whatsapp.reaction')?.tokenCost ?? 1 },
    { action: 'Poll / list', cost: costs.find(c => c.action === 'whatsapp.poll')?.tokenCost ?? 1 },
  ];

  const aiRows = [
    { action: 'AI reply generated', cost: costs.find(c => c.action === 'ai.reply')?.tokenCost ?? 10 },
    { action: 'Dataset search', cost: costs.find(c => c.action === 'ai.dataset_search')?.tokenCost ?? 2 },
    { action: 'Tool call', cost: costs.find(c => c.action === 'ai.tool_call')?.tokenCost ?? 2 },
    { action: 'Knowledge / memory search', cost: costs.find(c => c.action === 'ai.knowledge_search')?.tokenCost ?? 1 },
    { action: 'Memory save', cost: costs.find(c => c.action === 'ai.memory_save')?.tokenCost ?? 1 },
  ];

  const formatCost = (n: number) => n === 1 ? '1 token' : `${n} tokens`;

  return (
    <div className="bg-[#181711] border border-[#2d2813] p-5 rounded-2xl flex flex-col justify-between">
      <div>
        <button
          onClick={() => setExpanded(v => !v)}
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
          {expanded
            ? <ChevronUp size={16} className="text-[#6e684a]" />
            : <ChevronDown size={16} className="text-[#6e684a]" />}
        </button>

        {expanded && (
          <>
            <div className="mb-4 p-2.5 bg-[#2d2813] rounded-xl border border-[#3d3a1e] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eab308] shrink-0" />
              <p className="text-[10px] text-[#a8a99e]">
                <span className="font-semibold text-white">Workspace plans:</span>{' '}
                Starter 5K units/mo · Growth 50K · Business 250K · Enterprise 10M
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-4 h-4 border border-yellow-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6e684a] mb-2">WhatsApp Messages</p>
                  <div className="space-y-1">
                    {whatsappRows.map(row => (
                      <div key={row.action} className="flex items-center justify-between text-[11px] py-1 border-b border-[#2d2813] last:border-0">
                        <span className="text-[#a8a99e]">{row.action}</span>
                        <span className="font-mono font-bold text-[#eab308]">{formatCost(row.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6e684a] mb-2">AI Chatbot Units</p>
                  <div className="space-y-1">
                    {aiRows.map(row => (
                      <div key={row.action} className="flex items-center justify-between text-[11px] py-1 border-b border-[#2d2813] last:border-0">
                        <span className="text-[#a8a99e]">{row.action}</span>
                        <span className="font-mono font-bold text-[#eab308]">{formatCost(row.cost)}</span>
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
            )}
          </>
        )}

        {!expanded && (
          <p className="text-[11px] text-[#6e684a]">
            WhatsApp messages from 1 token · AI chatbot replies from 10 units ·{' '}
            <button onClick={e => { e.stopPropagation(); setExpanded(true); }}
              className="text-[#eab308] hover:underline font-semibold">
              View full cost guide →
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
