/**
 * LLMProvidersView — thin shell. All state lives here and is passed down.
 */
import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronUp, ChevronDown, AlertCircle, Loader2, Bot } from 'lucide-react';
import { fetchApi } from '../../../../data/api/client.js';
import { LLMProvider } from './types';
import { LLMProviderForm } from './LLMProviderForm';
import { LLMProviderTestPanel } from './LLMProviderTestPanel';
import { LLMProvidersTable } from './LLMProvidersTable';

export default function LLMProvidersView() {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalProvider, setModalProvider] = useState<LLMProvider | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<{
    providerName: string;
    result: { ok: boolean; models?: string[]; total?: number; error?: string };
  } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [setDefaultId, setSetDefaultId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<LLMProvider[]>('/api/admin/llm-providers/providers');
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

      {/* Table / loading / empty */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-stone-400" />
        </div>
      ) : (
        <LLMProvidersTable
          providers={providers}
          sortAsc={sortAsc}
          testingId={testingId}
          deletingId={deletingId}
          setDefaultId={setDefaultId}
          onSort={() => setSortAsc((v) => !v)}
          onEdit={handleEdit}
          onTest={handleTest}
          onSetDefault={handleSetDefault}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      {modalOpen && (
        <LLMProviderForm
          provider={modalProvider}
          onClose={() => setModalOpen(false)}
          onSaved={handleSave}
        />
      )}
      {testResult && (
        <LLMProviderTestPanel
          providerName={testResult.providerName}
          result={testResult.result}
          onClose={() => setTestResult(null)}
        />
      )}
    </div>
  );
}
