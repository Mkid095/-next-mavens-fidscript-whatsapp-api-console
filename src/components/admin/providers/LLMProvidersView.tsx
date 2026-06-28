/**
 * LLMProvidersView — admin UI for global LLM provider registry.
 *
 * Shows all llm_provider_registry rows with:
 *   - name, type, base_url, free/paid badge, default badge, enabled toggle
 * Per-row: Edit, Delete (guard check), Test (fetches model list), Set Default
 * "Add Provider" button → modal with name, type dropdown, base_url, API key,
 * free tier toggle, is_default toggle
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, TestTube, Star, StarOff,
  X, ChevronDown, ChevronUp, Bot, Globe, Key,
  AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react';
import { fetchApi, getAdminToken } from '../../../data/api/client.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LLMProvider {
  id: string;
  provider_type: string;
  name: string;
  description: string;
  base_url: string;
  auth_type: string;
  api_key_last4: string;
  is_default: number;
  is_free_tier: number;
  free_quota_tokens: number;
  config_json: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

// ─── Provider type metadata ────────────────────────────────────────────────────

const PROVIDER_META: Record<string, { label: string; icon: string; defaultUrl: string }> = {
  openai:     { label: 'OpenAI',        icon: '🤖', defaultUrl: 'https://api.openai.com/v1' },
  openrouter: { label: 'OpenRouter',    icon: '🔀', defaultUrl: 'https://openrouter.ai/api/v1' },
  anthropic:  { label: 'Anthropic',     icon: '🧠', defaultUrl: 'https://api.anthropic.com' },
  azure:      { label: 'Azure OpenAI',  icon: '☁️', defaultUrl: '' },
  gemini:     { label: 'Google Gemini', icon: '✨', defaultUrl: 'https://generativelanguage.googleapis.com' },
  ollama:     { label: 'Ollama',        icon: '🖥️', defaultUrl: 'http://localhost:11434/v1' },
  custom:     { label: 'Custom API',    icon: '🔧', defaultUrl: '' },
};

// ─── Add/Edit Modal ────────────────────────────────────────────────────────────

interface ProviderFormData {
  name: string;
  provider_type: string;
  description: string;
  base_url: string;
  auth_type: string;
  api_key: string;
  is_free_tier: boolean;
  free_quota_tokens: string;
  is_default: boolean;
  enabled: boolean;
}

function ProviderModal({
  provider,
  onClose,
  onSaved,
}: {
  provider?: LLMProvider;
  onClose: () => void;
  onSaved: (p: LLMProvider) => void;
}) {
  const isEdit = Boolean(provider);
  const [form, setForm] = useState<ProviderFormData>({
    name: provider?.name ?? '',
    provider_type: provider?.provider_type ?? 'openai',
    description: provider?.description ?? '',
    base_url: provider?.base_url ?? '',
    auth_type: provider?.auth_type ?? 'bearer',
    api_key: '',
    is_free_tier: Boolean(provider?.is_free_tier),
    free_quota_tokens: String(provider?.free_quota_tokens ?? 0),
    is_default: Boolean(provider?.is_default),
    enabled: provider ? Boolean(provider.enabled) : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = PROVIDER_META[form.provider_type];

  const set = (key: keyof ProviderFormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleTypeChange = (type: string) => {
    setForm((f) => ({
      ...f,
      provider_type: type,
      base_url: f.base_url || PROVIDER_META[type]?.defaultUrl || '',
    }));
  };

  const submit = async () => {
    if (!form.name.trim() || !form.provider_type) {
      setError('Name and type are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        provider_type: form.provider_type,
        description: form.description.trim(),
        base_url: form.base_url.trim(),
        auth_type: form.auth_type,
        is_free_tier: form.is_free_tier,
        free_quota_tokens: parseInt(form.free_quota_tokens) || 0,
        is_default: form.is_default,
        enabled: form.enabled,
      };
      if (form.api_key) body.api_key = form.api_key;

      const res = isEdit
        ? await fetchApi<LLMProvider>(`/api/admin/llm-providers/${provider.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : await fetchApi<{ id: string }>('/api/admin/llm-providers', {
            method: 'POST',
            body: JSON.stringify(body),
          });

      if (res.success && res.data) {
        // For creates, fetch the full record; for updates, use the response
        const saved = isEdit
          ? (res as unknown as { data: LLMProvider }).data
          : await fetchApi<LLMProvider>(`/api/admin/llm-providers/${('id' in res.data ? res.data.id : '')}`).then((r) => r.data);
        if (saved) onSaved(saved as LLMProvider);
        onClose();
      } else {
        setError(res.error ?? 'Save failed');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 p-4 pt-16" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot size={15} className="text-yellow-600" />
            <h3 className="text-sm font-semibold text-stone-800">
              {isEdit ? 'Edit Provider' : 'Add Provider'}
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3 p-4 max-h-[70vh] overflow-y-auto">
          {/* Provider type */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Provider Type *
            </label>
            <select
              value={form.provider_type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-yellow-500"
            >
              {Object.entries(PROVIDER_META).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Display Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Production OpenAI"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Short description for internal reference"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Base URL
            </label>
            <input
              type="url"
              value={form.base_url}
              onChange={(e) => set('base_url', e.target.value)}
              placeholder={meta?.defaultUrl || 'https://api.example.com/v1'}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-800 font-mono focus:outline-none focus:border-yellow-500"
            />
            {meta?.defaultUrl && (
              <p className="mt-0.5 text-[9px] text-stone-400">Default: {meta.defaultUrl}</p>
            )}
          </div>

          {/* Auth type */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Auth Type
            </label>
            <select
              value={form.auth_type}
              onChange={(e) => set('auth_type', e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-yellow-500"
            >
              <option value="bearer">Bearer Token</option>
              <option value="api_key">API Key Header</option>
              <option value="azure_ad">Azure AD (OAuth)</option>
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              {isEdit ? 'New API Key' : 'API Key'}
            </label>
            <div className="relative">
              <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                value={form.api_key}
                onChange={(e) => set('api_key', e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep current key' : 'sk-...'}
                className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-800 font-mono focus:outline-none focus:border-yellow-500"
              />
            </div>
            {isEdit && provider?.api_key_last4 && (
              <p className="mt-0.5 text-[9px] text-stone-400">
                Current key ends in: ****{provider.api_key_last4}
              </p>
            )}
          </div>

          {/* Free tier */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_free_tier}
                onChange={(e) => set('is_free_tier', e.target.checked)}
                className="accent-yellow-500"
              />
              <span className="text-xs text-stone-700 font-medium">Free tier provider</span>
            </label>
            {form.is_free_tier && (
              <input
                type="number"
                min="0"
                value={form.free_quota_tokens}
                onChange={(e) => set('free_quota_tokens', e.target.value)}
                placeholder="0"
                className="w-28 px-2 py-1 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:border-yellow-500"
              />
            )}
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => set('enabled', e.target.checked)}
                className="accent-yellow-500"
              />
              <span className="text-xs text-stone-700 font-medium">Enabled</span>
            </label>
          </div>

          {error && (
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-stone-200 px-4 py-3">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !form.name.trim()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-yellow-500 text-stone-900 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : null}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Provider'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Test Result Modal ─────────────────────────────────────────────────────────

function TestResultModal({
  providerName,
  result,
  onClose,
}: {
  providerName: string;
  result: { ok: boolean; models?: string[]; total?: number; error?: string };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <TestTube size={14} className="text-yellow-600" />
            <h3 className="text-sm font-semibold text-stone-800">Test: {providerName}</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={15} /></button>
        </div>
        <div className="p-4 space-y-3">
          {result.ok ? (
            <>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={16} />
                <span className="text-xs font-semibold">Connection successful</span>
              </div>
              {result.models && result.models.length > 0 && (
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                    Available models ({result.total})
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {result.models.map((m) => (
                      <span key={m} className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full text-[10px] font-mono">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-2 text-red-600">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs">{result.error ?? 'Connection failed'}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-stone-200 px-4 py-3">
          <button onClick={onClose} className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-800">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main View ─────────────────────────────────────────────────────────────────

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
      if (res.success) {
        await load();
      }
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