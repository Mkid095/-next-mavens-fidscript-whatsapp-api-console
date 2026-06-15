import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, ArrowLeft } from 'lucide-react';
import { PUBLIC_API_BASE, type ApiEndpoint } from '../../../data/apiEndpoints/index';
import { type CodeLang } from '../../../utils/codegen';
import VibeCopyButton from './VibeCopyButton.js';
import { generatePrompt } from './promptGenerator.js';

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

interface Step3PromptProps {
  apiKey: string;
  clientName?: string;
  selectedEps: ApiEndpoint[];
  instanceName?: string;
  onBack: () => void;
}

export default function Step3Prompt({ apiKey, clientName, selectedEps, instanceName, onBack }: Step3PromptProps) {
  const [lang, setLang] = useState<CodeLang>('node');
  const [showFull, setShowFull] = useState(false);

  const prompt = useMemo(() => generatePrompt(apiKey, clientName, selectedEps, lang, PUBLIC_API_BASE, instanceName), [apiKey, clientName, selectedEps, lang, instanceName]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl p-1">
          {LANG_OPTIONS.map(l => (
            <button key={l.id} onClick={() => setLang(l.id)}
              className={`px-2.5 py-1.5 text-[9px] font-bold rounded-lg transition-all ${lang === l.id ? 'bg-white text-forest-deep shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFull(v => !v)}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${showFull ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>
            {showFull ? 'Hide' : 'Show'} Full Prompt
          </button>
          <VibeCopyButton text={prompt} label="Copy Full Prompt" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.entries(selectedEps.reduce<Record<string, number>>((acc, ep) => {
          (acc[ep.category] ||= 0); acc[ep.category]++;
          return acc;
        }, {})).map(([cat, count]) => (
          <div key={cat} className="flex items-center gap-2 px-3 py-2 bg-[#f9f9f2] border border-[#eaebe4] rounded-xl">
            <span className="text-[10px] font-bold text-forest-deep">{count}×</span>
            <span className="text-[10px] text-graphite">{cat}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showFull && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border border-[#eaebe4] rounded-2xl overflow-hidden">
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

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-graphite uppercase tracking-wider">Or copy a specific section</p>
        {SECTIONS.map(section => (
          <button
            key={section}
            onClick={() => {
              const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const match = prompt.match(new RegExp(`## ${escaped}[\\s\\S]*?(?=## |\\n*---|$)`));
              if (match) navigator.clipboard.writeText(match[0].trim());
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-[#eaebe4] hover:border-yellow-300 hover:bg-yellow-50 rounded-xl transition-all text-left group">
            <span className="text-[11px] font-bold text-stone-700 group-hover:text-forest-deep">{section}</span>
            <Copy className="w-3.5 h-3.5 text-stone-400 group-hover:text-yellow-700" />
          </button>
        ))}
      </div>

      <button onClick={onBack}
        className="px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors inline-flex items-center gap-1">
        <ArrowLeft size={12} /> Edit Selection
      </button>
    </div>
  );
}
