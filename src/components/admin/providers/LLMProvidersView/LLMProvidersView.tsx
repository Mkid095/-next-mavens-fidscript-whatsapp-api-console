/**
 * LLMProvidersView — admin UI for global LLM provider registry.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, TestTube, Star, StarOff,
  ChevronDown, ChevronUp, Bot, AlertCircle, Loader2,
} from 'lucide-react';
import { fetchApi } from '../../../../data/api/client.js';
import { ProviderModal } from './ProviderModal';
import { TestResultModal } from './TestResultModal';
import type { LLMProvider } from './types';

const PROVIDER_META: Record<string, { label: string; icon: string; defaultUrl: string }> = {
  openai:     { label: 'OpenAI',        icon: '🤖', defaultUrl: 'https://api.openai.com/v1' },
  openrouter: { label: 'OpenRouter',    icon: '🔀', defaultUrl: 'https://openrouter.ai/api/v1' },
  anthropic:  { label: 'Anthropic',     icon: '🧠', defaultUrl: 'https://api.anthropic.com' },
  azure:     { label: 'Azure OpenAI',  icon: '☁️', defaultUrl: '' },
  gemini:    { label: 'Google Gemini', icon: '✨', defaultUrl: 'https://generativelanguage.googleapis.com' },
  ollama:    { label: 'Ollama',        icon: '🖥️', defaultUrl: 'http://localhost:11434/v1' },
  custom:    { label: 'Custom API',    icon: '🔧', defaultUrl: '' },
};

export default function LLMProvidersView() {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalProvider, setModalProvider] = useState<LLMProvider | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ providerName: string; result: { ok: boolean; models?: string[]; total?: number; error?: string } } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [setDefaultId, setSetDefaultId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<LLMProvider[]>('/api/admin/llm-providers');
      if (res.success && res.data) {
        setProviders(res.data);
      } else {
        setError(res.error ?? 'Failed to load providers');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = (saved: LLMProvider) => {
    setProviders((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  };

  const handleAdd = () => { setModalProvider(undefined); setModalOpen(true); };
  const handleEdit = (p: LLMProvider) => { setModalProvider(p); setModalOpen(true); };

  const handleTest = async (p: LLMProvider) => {
    setTestingId(p.id);
    try {
      const res = await fetchApi<{ ok: boolean; models?: string[]; total?: number; error?: string }>(
        `/api/admin/llm-providers/${p.id}/test`,
        { method: 'POST' }
      );
      setTestResult({ providerName: p.name, result: res.data ?? { ok: false, error: res.error } });
    } catch (e) {
      setTestResult({ providerName: p.name, result: { ok: false, error: String(e) } });
    } finally {
      setTestingId(null);
    }
  };

  const handleSetDefault = async (p: LLMProvider) => {
    setSetDefaultId(p.id);
    try {
      const res = await fetchApi(`/api/admin/llm-providers/${p.id}/set-default`, { method: 'POST' });
      if (res.success) await load();
    } finally {
      setSetDefaultId(null);
    }
  };

  const handleDelete = async (p: LLMProvider) => {
    if (!window.confirm(`Delete provider "${p.name}"? This cannot be undone.`)) return;
    setDeletingId(p.id);
    try {
      const res = await fetchApi(`/api/admin/llm-providers/${p.id}`, { method: 'DELETE' });
      if (res.success) {
        setProviders((prev) => prev.filter((x) => x.id !== p.id));
      } else {
        alert(res.error ?? 'Delete failed');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const sorted = [...providers].sort((a, b) => {
    const av = a.name.toLowerCase();
    const bv = b.name.toLowerCase();
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-stone-800">LLM Providers</h2>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Global provider templates — workspaces reference these when connecting AI models.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortAsc((v) => !v)}
            className="flex items-center gap-1 px-3 py-2 text-xs text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl transition-colors"
          >
            {sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Sort
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-yellow-500 text-stone-900 rounded-xl hover:bg-yellow-400 transition-colors"
          >
            <Plus size={13} />
            Add Provider
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle size={14} />
          {error}
          <button onClick={load} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-stone-400" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-stone-400">
          <Bot size={32} className="mb-2 opacity-30" />
          <p className="text-sm font-medium">No providers configured</p>
          <p className="text-[11px]">Add your first LLM provider above</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">Provider</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider hidden md:table-cell">Base URL</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Auth</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">Tier</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">Default</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sorted.map((p) => {
                const meta = PROVIDER_META[p.provider_type];
                return (
                  <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                    {/* Provider */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta?.icon ?? '🔧'}</span>
                        <div>
                          <p className="font-semibold text-stone-800">{p.name}</p>
                          <p className="text-[10px] text-stone-400">{meta?.label ?? p.provider_type}</p>
                        </div>
                      </div>
                    </td>
                    {/* Base URL */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-[10px] font-mono text-stone-500 truncate max-w-[180px]" title={p.base_url}>
                        {p.base_url || '—'}
                      </p>
                    </td>
                    {/* Auth */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-[10px] text-stone-500 uppercase">{p.auth_type}</span>
                    </td>
                    {/* Tier */}
                    <td className="px-4 py-3 text-center">
                      {p.is_free_tier ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                          Free
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full text-[10px] font-medium">
                          Paid
                        </span>
                      )}
                    </td>
                    {/* Default */}
                    <td className="px-4 py-3 text-center">
                      {p.is_default ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-100 rounded-full">
                          <Star size={11} className="text-yellow-600" />
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(p)}
                          disabled={setDefaultId === p.id}
                          className="inline-flex items-center justify-center w-5 h-5 hover:bg-stone-100 rounded-full transition-colors disabled:opacity-40"
                          title="Set as default"
                        >
                          <StarOff size={11} className="text-stone-300" />
                        </button>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.enabled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-100 text-stone-400'
                      }`}>
                        {p.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleTest(p)}
                          disabled={testingId === p.id}
                          className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-stone-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Test connection"
                        >
                          {testingId === p.id ? <Loader2 size={11} className="animate-spin" /> : <TestTube size={11} />}
                          Test
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-stone-500 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={11} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.id}
                          className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <ProviderModal
          provider={modalProvider}
          onClose={() => setModalOpen(false)}
          onSaved={handleSave}
        />
      )}

      {/* Test Result Modal */}
      {testResult && (
        <TestResultModal
          providerName={testResult.providerName}
          result={testResult.result}
          onClose={() => setTestResult(null)}
        />
      )}
    </div>
  );
}
