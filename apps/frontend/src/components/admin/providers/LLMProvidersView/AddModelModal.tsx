/**
 * AddModelModal — inline add model modal.
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Cpu, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  providerName: string;
  onClose: () => void;
  onAdd: (body: Record<string, unknown>) => Promise<void>;
}

export function AddModelModal({ providerName, onClose, onAdd }: Props) {
  const [modelId, setModelId] = useState('');
  const [contextLength, setContextLength] = useState('4096');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!modelId.trim()) { setError('Model ID is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const deriveName = (id: string) =>
        id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await onAdd({
        model_id: modelId.trim(),
        model_name: deriveName(modelId.trim()),
        context_length: parseInt(contextLength) || 4096,
        supports_tools: false,
        supports_json_mode: false,
        latency_class: 'medium',
        cost_per_1k_input_tokens: 0,
        cost_per_1k_output_tokens: 0,
      });
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  };

  const fc = 'w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-[#cbd3cf] placeholder-[#525345] focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/20 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 pt-16" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-[#1a1915] border border-[#2d2813] shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#2d2813] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl border bg-yellow-500/10 border-yellow-500/30">
              <Cpu size={15} className="text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#cbd3cf]">Add Model</h3>
              <p className="text-[10px] text-[#6e684a]">to {providerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#a8a99e] hover:text-[#cbd3cf] hover:bg-[#2d2813] transition-colors" aria-label="Close"><X size={15} /></button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">Model ID *</label>
            <input type="text" value={modelId} onChange={(e) => setModelId(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !saving) submit(); }}
              placeholder="e.g. gpt-4o-mini" autoFocus className={`${fc} font-mono`} />
            <p className="mt-1 text-[10px] text-[#6e684a]">The exact model ID the API expects</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">Context Length</label>
            <input type="number" value={contextLength} onChange={(e) => setContextLength(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !saving) submit(); }}
              placeholder="4096" className={fc} />
            <p className="mt-1 text-[10px] text-[#6e684a]">Maximum tokens the model can process (e.g. 128000)</p>
          </div>
          {error && (
            <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#2d2813] px-5 py-3 bg-[#12110c]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-[#a8a99e] hover:text-[#cbd3cf] transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-yellow-500 text-[#11110a] rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yellow-500/40">
            {saving && <Loader2 size={12} className="animate-spin" />} Add Model
          </button>
        </div>
      </motion.div>
    </div>
  );
}
