import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Loader } from 'lucide-react';
import { PUBLIC_API_BASE, type ApiEndpoint } from '../../../../data/apiEndpoints/index';
import { type CodeLang } from '../../../../utils/codegen';
import VibeCopyButton from '../VibeCopyButton';
import { generatePrompt } from '../promptGenerator';

const LANG_OPTIONS: { id: CodeLang; label: string }[] = [
  { id: 'node', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'go', label: 'Go' },
  { id: 'curl', label: 'cURL' },
];

const SECTIONS = [
  'Project Context', 'API Credentials', 'Quick Reference', 'Installation',
  'Base Request Helper', 'Endpoint Reference', 'Integration Notes', 'Webhook Integration',
] as const;

interface PromptEditorProps {
  resolvedKey: string;
  clientName?: string;
  selectedEps: ApiEndpoint[];
  instanceName?: string;
  fullKey: string | null;
  fetchingKey: boolean;
  keyId: string;
  clientToken: string;
}

export function PromptEditor({
  resolvedKey,
  clientName,
  selectedEps,
  instanceName,
  fullKey,
  fetchingKey,
  keyId,
  clientToken,
}: PromptEditorProps) {
  const [lang, setLang] = useState<CodeLang>('node');
  const [showFull, setShowFull] = useState(false);
  const [localFullKey, setLocalFullKey] = useState<string | null>(fullKey);

  // Fetch the full key server-side if keyId is provided instead of a pasted key
  useEffect(() => {
    if (keyId && clientToken) {
      fetchFullKey(keyId, clientToken).then(k => {
        setLocalFullKey(k);
      });
    }
  }, [keyId, clientToken]);

  const prompt = useMemo(
    () => generatePrompt(resolvedKey, clientName, selectedEps, lang, PUBLIC_API_BASE, instanceName),
    [resolvedKey, clientName, selectedEps, lang, instanceName]
  );

  // Clipboard helper with fallback
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  return (
    <div className="space-y-5">
      {/* Language + actions bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-[#1a1915] rounded-xl p-1">
          {LANG_OPTIONS.map(l => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className={`px-2.5 py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                lang === l.id ? 'bg-[#eab308] text-[#181711] shadow-sm' : 'text-[#5a554a] hover:text-[#a8a99e]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFull(v => !v)}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
              showFull ? 'bg-[#eab308] text-[#181711] border-[#eab308]' : 'bg-[#1a1915] text-[#a8a99e] border-[#2d2813] hover:bg-[#3d3a1e]'
            }`}
          >
            {showFull ? 'Hide' : 'Show'} Full Prompt
          </button>
          <VibeCopyButton text={prompt} label="Copy Full Prompt" />
        </div>
      </div>

      {/* Key status indicator */}
      {fetchingKey ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1915] border border-[#2d2813] rounded-xl text-[10px] text-[#eab308]">
          <Loader className="w-3 h-3 animate-spin" />
          Fetching your API key securely from the server…
        </div>
      ) : keyId && !localFullKey ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1915] border border-red-800 rounded-xl text-[10px] text-red-400">
          Could not fetch key — paste it manually or go back and re-select.
        </div>
      ) : null}

      {/* Selected endpoints summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.entries(selectedEps.reduce<Record<string, number>>((acc, ep) => {
          (acc[ep.category] ||= 0); acc[ep.category]++;
          return acc;
        }, {})).map(([cat, count]) => (
          <div key={cat} className="flex items-center gap-2 px-3 py-2 bg-[#1a1915] border border-[#2d2813] rounded-xl">
            <span className="text-[10px] font-bold text-[#eab308]">{count}×</span>
            <span className="text-[10px] text-[#a8a99e]">{cat}</span>
          </div>
        ))}
      </div>

      {/* Instance + key indicators */}
      {(instanceName || resolvedKey) && (
        <div className="flex flex-wrap gap-2">
          {instanceName && (
            <span className="px-2 py-1 bg-[#1a1915] border border-[#2d2813] rounded-lg text-[9px] font-mono text-[#5a554a]">
              Container: {instanceName}
            </span>
          )}
          {resolvedKey && (
            <span className="px-2 py-1 bg-green-900/30 border border-green-800/50 rounded-lg text-[9px] font-mono text-green-400">
              Key: {resolvedKey.substring(0, 20)}… (fetched server-side)
            </span>
          )}
        </div>
      )}

      {/* Full prompt */}
      <AnimatePresence>
        {showFull && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border border-[#2d2813] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1613] border-b border-[#162721]">
                <span className="text-[10px] font-mono font-bold text-emerald-400">Generated Prompt</span>
                <VibeCopyButton text={prompt} label="Copy" />
              </div>
              <pre className="p-4 text-[10px] font-mono text-emerald-200 bg-[#09100e] overflow-auto max-h-96 leading-relaxed whitespace-pre-wrap">
                {prompt}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section buttons */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-[#a8a99e] uppercase tracking-wider">Or copy a specific section</p>
        {SECTIONS.map(section => (
          <button
            key={section}
            onClick={() => {
              const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const match = prompt.match(new RegExp(`## ${escaped}[\\s\\S]*?(?=## |\\n*---|$)`));
              if (match) copyToClipboard(match[0].trim());
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1a1915] border border-[#2d2813] hover:border-[#eab308] hover:bg-[#3d3a1e] rounded-xl transition-all text-left group"
          >
            <span className="text-[11px] font-bold text-[#a8a99e] group-hover:text-[#eab308]">{section}</span>
            <Copy className="w-3.5 h-3.5 text-[#5a554a] group-hover:text-[#eab308]" />
          </button>
        ))}
      </div>
    </div>
  );
}

async function fetchFullKey(keyId: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/sandbox/key/${keyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.success ? data.api_key : null;
  } catch {
    return null;
  }
}
