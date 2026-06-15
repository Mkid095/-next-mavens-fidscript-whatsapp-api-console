import React, { useState } from 'react';
import { X, SendHorizontal, RefreshCw, BarChart2, Plus, Trash2 } from 'lucide-react';
import type { Instance } from '../../services/api';
import { instancesApi } from '../../services/api';
import { TOKEN_COST } from '../../utils/tokenCosts';

interface PollInlineEditorProps {
  instance: Instance;
  to: string;
  onSend: (tokenCost: number) => void;
  onCancel: () => void;
}

export default function PollInlineEditor({ instance, to, onSend, onCancel }: PollInlineEditorProps) {
  const [question, setQuestion] = useState('');
  const [selectableCount, setSelectableCount] = useState(1);
  const [options, setOptions] = useState(['', '']);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => setOptions(p => [...p, '']);
  const removeOption = (i: number) => setOptions(p => p.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => setOptions(p => p.map((v, idx) => idx === i ? val : v));

  const filledOptions = options.filter(o => o.trim());
  const previewOptions = filledOptions.length >= 2 ? filledOptions : options.filter(o => o);

  const handleSend = async () => {
    if (!question.trim() || filledOptions.length < 2) { setError('Question and at least 2 options required'); return; }
    setSending(true); setError('');
    try {
      const res = await instancesApi.sendPoll(instance.name, to, { name: question.trim(), selectableCount, values: filledOptions });
      if (res.success) { onSend(TOKEN_COST.POLL); onCancel(); }
      else { setError(res.error || 'Failed to send'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div className="border-t border-[#eaebe4] bg-white p-3">
      <div className="flex items-start gap-2">
        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <input
            value={question} onChange={e => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-bold"
          />

          <div className="space-y-1.5">
            {previewOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0 ml-1" />
                <input
                  value={opt} onChange={e => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 px-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-stone-50"
                />
                {options.length > 2 && (
                  <button onClick={() => removeOption(i)} className="text-stone-400 hover:text-red-500 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addOption} className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 hover:text-yellow-700 px-2 py-1 transition-all">
              <Plus className="w-3 h-3" /> Add option
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-400">Allow</span>
            {[1, 2, 3].map(n => (
              <button key={n} onClick={() => setSelectableCount(n)}
                className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all ${selectableCount === n ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-500 border-[#eaebe4]'}`}>
                {n}
              </button>
            ))}
            <span className="text-[10px] text-stone-400">selection(s)</span>
          </div>

          {/* Live preview */}
          <div className="bg-stone-50 rounded-2xl p-3 space-y-1.5">
            <p className="text-xs font-bold text-forest-deep">{question || 'Your question...'}</p>
            {previewOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 border border-[#eaebe4] rounded" />
                <span className="text-xs text-stone-600">{opt || `Option ${i + 1}`}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-[10px] text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button onClick={onCancel} className="px-3 py-2 text-xs font-bold text-stone-400 hover:text-stone-600 transition-all">Cancel</button>
            <button
              onClick={handleSend}
              disabled={!question.trim() || filledOptions.length < 2 || sending}
              className="flex-1 py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
            >
              {sending ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</> : <><SendHorizontal className="w-3.5 h-3.5" /> Send Poll</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
