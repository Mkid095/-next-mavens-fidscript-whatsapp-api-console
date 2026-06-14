import React, { useState } from 'react';
import { X, BarChart2, SendHorizontal, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { Instance } from '../../../services/api';
import { instancesApi } from '../../../services/api';
import { TOKEN_COST } from '../../../utils/tokenCosts';

interface PollSendModalProps {
  instance: Instance;
  to: string;
  onClose: () => void;
  onSend: (tokenCost: number) => void;
}

export default function PollSendModal({ instance, to, onClose, onSend }: PollSendModalProps) {
  const [question, setQuestion] = useState('');
  const [selectableCount, setSelectableCount] = useState(1);
  const [options, setOptions] = useState(['', '']);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => setOptions(prev => [...prev, '']);
  const removeOption = (i: number) => setOptions(prev => prev.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => setOptions(prev => prev.map((v, idx) => idx === i ? val : v));

  const handleSend = async () => {
    const filledOptions = options.filter(o => o.trim());
    if (!question.trim() || filledOptions.length < 2) {
      setError('Poll question and at least 2 options are required');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await instancesApi.sendPoll(instance.name, to, {
        name: question.trim(),
        selectableCount,
        values: filledOptions,
      });
      if (res.success) {
        onSend(TOKEN_COST.POLL);
        onClose();
      } else {
        setError(res.error || 'Failed to send poll');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send poll');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-md mx-4 overflow-hidden shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-[#eaebe4] flex items-center justify-between bg-[#fafaf5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-forest-deep">Send Poll</h3>
              <p className="text-[10px] text-stone-500 font-mono">{to}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-stone-200 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Question</label>
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="What is your preference?"
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Selectable Options</label>
            <div className="flex items-center gap-3 mt-1.5">
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setSelectableCount(n)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all ${
                    selectableCount === n
                      ? 'bg-forest-deep text-white border-forest-deep'
                      : 'bg-white text-stone-600 border-[#eaebe4] hover:border-forest-deep'
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="text-[10px] text-stone-400 ml-1">choices allowed</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Options</label>
              <button
                onClick={addOption}
                className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-stone-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600">{error}</div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-stone-400">{TOKEN_COST.POLL} token</span>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#eaebe4] flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#eaebe4] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!question.trim() || options.filter(o => o.trim()).length < 2 || sending}
            className="flex-1 py-2.5 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <SendHorizontal className="w-3.5 h-3.5" />}
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
