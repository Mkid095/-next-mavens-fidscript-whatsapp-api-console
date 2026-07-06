import { useState } from 'react';
import { Cpu, Key, X, Loader2, AlertCircle } from 'lucide-react';
import { fetchApi } from '../../data/api/client.js';

const RESPONSE_TYPES: Record<string, { label: string; defaultUrl: string }> = {
  openai:     { label: 'OpenAI-compatible', defaultUrl: 'https://api.openai.com/v1' },
  anthropic:  { label: 'Anthropic Messages', defaultUrl: 'https://api.anthropic.com' },
  gemini:     { label: 'Google Gemini', defaultUrl: 'https://generativelanguage.googleapis.com' },
  ollama:     { label: 'Ollama (local)', defaultUrl: 'http://localhost:11434/v1' },
  openrouter: { label: 'OpenRouter', defaultUrl: 'https://openrouter.ai/api/v1' },
  custom:     { label: 'Custom API', defaultUrl: '' },
};

interface LLMConnectionFormProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function LLMConnectionForm({ onClose, onSaved }: LLMConnectionFormProps) {
  const [name, setName] = useState('');
  const [responseType, setResponseType] = useState('openai');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = RESPONSE_TYPES[responseType];

  const submit = async () => {
    if (!responseType) { setError('Response type is required'); return; }
    if (!apiKey.trim()) { setError('API key is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        provider: responseType,
        api_key: apiKey.trim(),
        endpoint: baseUrl.trim() || meta?.defaultUrl || '',
      };
      if (name.trim()) body.name = name.trim();

      const res = await fetchApi('/api/platform/llm-connections', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (res.success) {
        onSaved();
        onClose();
      } else {
        setError(res.error ?? 'Failed to create connection');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 p-4 pt-16" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Cpu size={15} className="text-yellow-600" />
            <h3 className="text-sm font-semibold text-stone-800">Add LLM Connection</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={15} /></button>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Name (optional)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production OpenAI"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Response Type *</label>
            <select value={responseType} onChange={(e) => { setResponseType(e.target.value); setBaseUrl(''); }}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-yellow-500">
              {Object.entries(RESPONSE_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <p className="mt-0.5 text-[9px] text-stone-400">How the API responds — determines which adapter the gateway uses</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Base URL</label>
            <input type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={meta?.defaultUrl || 'https://api.example.com/v1'}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs text-stone-800 font-mono focus:outline-none focus:border-yellow-500" />
            {meta?.defaultUrl && <p className="mt-0.5 text-[9px] text-stone-400">Default: {meta.defaultUrl}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">API Key *</label>
            <div className="relative">
              <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key"
                className={`w-full pl-8 pr-3 py-2 border rounded-xl text-xs text-stone-800 font-mono focus:outline-none ${error && !apiKey ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-yellow-500'}`} />
            </div>
            <p className="mt-0.5 text-[9px] text-stone-400">Encrypted (AES-256-GCM) before storage</p>
          </div>
          {error && (
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-stone-200 px-4 py-3">
          <button onClick={onClose} className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-yellow-500 text-stone-900 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50">
            {saving && <Loader2 size={12} className="animate-spin" />} Add Connection
          </button>
        </div>
      </div>
    </div>
  );
}
