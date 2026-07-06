/**
 * ProviderModelsSection — expandable models list within a provider card.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Loader2, Cpu, Zap, Hash, DollarSign, Boxes } from 'lucide-react';
import { fetchApi } from '../../../../data/api/client.js';
import { ProviderModel } from './types';
import { CapabilityChip, ConfirmDialog } from './shared';
import { AddModelModal } from './AddModelModal';

export function ProviderModelsSection({ providerId, providerName }: { providerId: string; providerName: string }) {
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModelConfirm, setDeleteModelConfirm] = useState<ProviderModel | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi<ProviderModel[]>(`/api/admin/llm-providers/${providerId}/models`);
      if (res.success && res.data) setModels(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [providerId]);

  useEffect(() => { load(); }, [load]);

  const handleAddModel = async (body: Record<string, unknown>) => {
    const res = await fetchApi(`/api/admin/llm-providers/${providerId}/models`, {
      method: 'POST', body: JSON.stringify(body),
    });
    if (res.success) { setShowAdd(false); await load(); }
    else throw new Error(res.error ?? 'Failed to add model');
  };

  const handleDeleteModel = (model: ProviderModel) => setDeleteModelConfirm(model);

  const confirmDeleteModel = async () => {
    if (!deleteModelConfirm) return;
    const model = deleteModelConfirm;
    setDeletingId(model.id);
    try {
      const res = await fetchApi(`/api/admin/llm-providers/${providerId}/models/${model.id}`, { method: 'DELETE' });
      if (res.success) { setModels((prev) => prev.filter((m) => m.id !== model.id)); setDeleteModelConfirm(null); }
    } finally { setDeletingId(null); }
  };

  const formatContext = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return String(n);
  };

  return (
    <div className="p-4 bg-[#12110c] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes size={13} className="text-[#6e684a]" />
          <h4 className="text-[10px] font-bold text-[#a8a99e] uppercase tracking-wider">Available Models</h4>
          {models.length > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-[#2d2813] text-[#a8a99e] rounded-full font-mono">{models.length}</span>}
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/30">
          <Plus size={11} /> Add Model
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={16} className="animate-spin text-[#6e684a]" /></div>
      ) : models.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1a1915] border border-[#2d2813] mb-3">
            <Cpu size={20} className="text-[#525345]" />
          </div>
          <p className="text-xs font-semibold text-[#a8a99e]">No models configured</p>
          <p className="text-[10px] text-[#6e684a] mt-1 max-w-xs">Add the specific models this provider offers so chatbots can reference them</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {models.map((m) => (
            <div key={m.id} className="group flex items-center gap-3 p-2.5 bg-[#1a1915] rounded-xl border border-[#2d2813] hover:border-[#3d3a1e] transition-colors">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2d2813] shrink-0">
                <Cpu size={14} className="text-[#a8a99e]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-semibold text-[#cbd3cf] truncate">{m.model_name}</p>
                  {m.supports_tools ? <CapabilityChip label="Tools" variant="tools" /> : null}
                  {m.supports_json_mode ? <CapabilityChip label="JSON" variant="json" /> : null}
                  <CapabilityChip
                    icon={m.latency_class === 'fast' ? <Zap size={8} /> : undefined}
                    label={m.latency_class}
                    variant={m.latency_class === 'fast' ? 'fast' : m.latency_class === 'slow' ? 'slow' : 'default'}
                  />
                  {!m.enabled ? <CapabilityChip label="Off" variant="default" /> : null}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#6e684a]">
                    <Hash size={9} /><span className="font-mono">{m.model_id}</span>
                  </span>
                  <span className="text-[10px] text-[#6e684a]">{formatContext(m.context_length)} ctx</span>
                  {(m.cost_per_1k_input_tokens > 0 || m.cost_per_1k_output_tokens > 0) && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#6e684a]">
                      <DollarSign size={9} />
                      ${m.cost_per_1k_input_tokens.toFixed(3)} in / ${m.cost_per_1k_output_tokens.toFixed(3)} out per 1K
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => handleDeleteModel(m)} disabled={deletingId === m.id}
                className="p-1.5 text-[#525345] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40 shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                title="Remove model" aria-label={`Remove ${m.model_name}`}>
                {deletingId === m.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAdd && <AddModelModal providerName={providerName} onClose={() => setShowAdd(false)} onAdd={handleAddModel} />}
        {deleteModelConfirm && (
          <ConfirmDialog
            title={`Remove "${deleteModelConfirm.model_name}"?`}
            message={`This will remove the model "${deleteModelConfirm.model_id}" from ${providerName}. Chatbots using this model will need to be reconfigured.`}
            confirmLabel="Remove Model" onConfirm={confirmDeleteModel}
            onClose={() => { if (!deletingId) setDeleteModelConfirm(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
