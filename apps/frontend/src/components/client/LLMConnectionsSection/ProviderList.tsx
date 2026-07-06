import { Globe, CheckCircle2 } from 'lucide-react';

interface FidscriptProvider {
  id: string;
  provider_type: string;
  name: string;
  description: string;
  base_url: string;
}

const RESPONSE_TYPES: Record<string, { label: string }> = {
  openai:     { label: 'OpenAI-compatible' },
  anthropic:  { label: 'Anthropic Messages' },
  gemini:     { label: 'Google Gemini' },
  ollama:     { label: 'Ollama (local)' },
  openrouter: { label: 'OpenRouter' },
  custom:     { label: 'Custom API' },
};

interface ProviderListProps {
  fidscriptProviders: FidscriptProvider[];
}

export default function ProviderList({ fidscriptProviders }: ProviderListProps) {
  return (
    <div className="rounded-2xl border border-blue-800/40 bg-blue-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Globe size={14} className="text-blue-400" />
        <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">FIDScript Default Providers</h3>
      </div>
      <p className="text-[11px] text-stone-400 mb-3">
        These are pre-configured by FIDScript — you can use them in chatbots without your own API key.
      </p>
      <div className="space-y-2">
        {fidscriptProviders.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-2.5 bg-stone-900/40 rounded-xl border border-stone-800">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
              <Globe size={14} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-200">{p.name}</p>
              <p className="text-[10px] text-stone-500">{p.description || RESPONSE_TYPES[p.provider_type]?.label}</p>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[9px] font-bold">
              <CheckCircle2 size={9} /> Ready
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
