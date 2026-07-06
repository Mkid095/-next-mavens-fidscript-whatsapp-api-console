import { Cpu, Key, TestTube, Trash2, Loader2 } from 'lucide-react';

const RESPONSE_TYPES: Record<string, { label: string }> = {
  openai:     { label: 'OpenAI-compatible' },
  anthropic:  { label: 'Anthropic Messages' },
  gemini:     { label: 'Google Gemini' },
  ollama:     { label: 'Ollama (local)' },
  openrouter: { label: 'OpenRouter' },
  custom:     { label: 'Custom API' },
};

interface LlmConnection {
  id: string;
  name: string;
  provider: string;
  api_key_last4: string;
  model: string;
  endpoint: string;
  enabled: number;
  is_default: number;
  created_at: string;
}

interface LLMConnectionCardProps {
  conn: LlmConnection;
  testingId: string | null;
  deletingId: string | null;
  onTest: () => void;
  onDelete: () => void;
}

export default function LLMConnectionCard({
  conn,
  testingId,
  deletingId,
  onTest,
  onDelete,
}: LLMConnectionCardProps) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/40 shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${conn.enabled ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-stone-800 border border-stone-700'}`}>
          <Cpu size={18} className={conn.enabled ? 'text-yellow-500' : 'text-stone-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-stone-200 text-sm">{conn.name}</p>
            {conn.is_default ? (
              <span className="inline-flex px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-full text-[9px] font-bold">Default</span>
            ) : null}
            <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold ${conn.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-800 text-stone-500'}`}>
              {conn.enabled ? 'Active' : 'Disabled'}
            </span>
            {conn.api_key_last4 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-stone-800 text-stone-400 rounded-full text-[9px] font-mono">
                <Key size={9} /> ****{conn.api_key_last4}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-stone-500">{RESPONSE_TYPES[conn.provider]?.label ?? conn.provider}</p>
            {conn.endpoint && <p className="text-[10px] font-mono text-stone-600 truncate hidden sm:block">{conn.endpoint}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onTest} disabled={testingId === conn.id}
            className="p-2 text-stone-500 hover:text-blue-400 hover:bg-blue-950/40 rounded-lg transition-colors disabled:opacity-40" title="Test connection">
            {testingId === conn.id ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}
          </button>
          <button onClick={onDelete} disabled={deletingId === conn.id}
            className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-40" title="Delete">
            {deletingId === conn.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
