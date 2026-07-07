/**
 * ProviderModal — Add/Edit LLM provider modal.
 */
import { useState } from 'react';
import {
  Plus, Pencil, X, Bot, Key,
  AlertCircle, Loader2,
} from 'lucide-react';
import { fetchApi } from '../../../../data/api/client.js';
import type { LLMProvider } from './types';

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

const PROVIDER_META: Record<string, { label: string; icon: string; defaultUrl: string }> = {
  openai:     { label: 'OpenAI',        icon: '🤖', defaultUrl: 'https://api.openai.com/v1' },
  openrouter: { label: 'OpenRouter',    icon: '🔀', defaultUrl: 'https://openrouter.ai/api/v1' },
  anthropic:  { label: 'Anthropic',     icon: '🧠', defaultUrl: 'https://api.anthropic.com' },
  azure:     { label: 'Azure OpenAI',  icon: '☁️', defaultUrl: '' },
  gemini:    { label: 'Google Gemini', icon: '✨', defaultUrl: 'https://generativelanguage.googleapis.com' },
  ollama:    { label: 'Ollama',        icon: '🖥️', defaultUrl: 'http://localhost:11434/v1' },
  custom:    { label: 'Custom API',    icon: '🔧', defaultUrl: '' },
};

export function ProviderModal({
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
        ? await fetchApi<LLMProvider>(`/api/admin/llm-providers/${provider!.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : await fetchApi<{ id: string }>('/api/admin/llm-providers', {
            method: 'POST',
            body: JSON.stringify(body),
          });

      if (res.success && res.data) {
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
