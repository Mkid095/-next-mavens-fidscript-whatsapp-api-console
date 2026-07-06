/**
 * LLMProviderFormBody — the form fields for Add/Edit provider modal.
 */
import { useState } from 'react';
import { Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { PROVIDER_META, fieldClass, fieldClassMono, ProviderFormData } from './types';

function DarkInput({ label, hint, error, children }: { label?: string; hint?: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-[10px] text-[#6e684a]">{hint}</p>}
      {error && <p className="mt-1.5 text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}</p>}
    </div>
  );
}

interface Props {
  form: ProviderFormData;
  isEdit: boolean;
  error: string | null;
  onChange: (key: keyof ProviderFormData, value: string) => void;
}

export function LLMProviderFormBody({ form, isEdit, error, onChange }: Props) {
  const meta = PROVIDER_META[form.provider_type];

  const handleTypeChange = (type: string) => {
    onChange('provider_type', type);
    if (!form.base_url) onChange('base_url', PROVIDER_META[type]?.defaultUrl || '');
  };

  return (
    <div className="space-y-4 p-5 max-h-[70vh] overflow-y-auto">
      <DarkInput label="Provider Type *">
        <select value={form.provider_type} onChange={(e) => handleTypeChange(e.target.value)} disabled={isEdit}
          className={`${fieldClass} disabled:opacity-50 disabled:cursor-not-allowed`}>
          {Object.entries(PROVIDER_META).map(([k, v]) => (
            <option key={k} value={k} className="bg-[#1a1915] text-[#cbd3cf]">{v.label}</option>
          ))}
        </select>
        {isEdit && <p className="mt-1 text-[10px] text-[#6e684a]">Provider type cannot be changed after creation</p>}
      </DarkInput>

      <DarkInput label="Display Name *">
        <input type="text" value={form.name} onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g. Production OpenAI" className={fieldClass} />
      </DarkInput>

      <DarkInput label="Description">
        <input type="text" value={form.description} onChange={(e) => onChange('description', e.target.value)}
          placeholder="Short description for internal reference" className={fieldClass} />
      </DarkInput>

      <DarkInput label="Base URL" hint={meta?.defaultUrl ? `Default: ${meta.defaultUrl}` : undefined}>
        <input type="url" value={form.base_url} onChange={(e) => onChange('base_url', e.target.value)}
          placeholder={meta?.defaultUrl || 'https://api.example.com/v1'} className={fieldClassMono} />
      </DarkInput>

      <DarkInput label={isEdit ? 'New API Key (leave blank to keep current)' : 'API Key *'}
        hint={!isEdit ? 'The key is encrypted (AES-256-GCM) before storage' : undefined}>
        <div className="relative">
          <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525345]" />
          <input type="password" value={form.api_key} onChange={(e) => onChange('api_key', e.target.value)}
            placeholder={isEdit ? '••••••••••••' : 'Paste your API key here'} className={`${fieldClassMono} pl-8`} />
        </div>
      </DarkInput>

      {error && (
        <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
