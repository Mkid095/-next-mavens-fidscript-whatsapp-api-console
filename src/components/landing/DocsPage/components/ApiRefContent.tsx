import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { CopyButton } from '../../../shared/CopyButton.tsx';
import { LangTabs } from './LangTabs.tsx';
import { ParamTable } from './ParamTable.tsx';
import { buildCodeSnippet } from '../buildCodeSnippet.ts';
import { METHOD_COLORS } from '../types.ts';
import { PUBLIC_API_BASE } from '../../../../data/apiEndpoints/index';

interface Endpoint {
  method: string;
  path: string;
  name: string;
  desc?: string;
  params: { name: string; type: string; required: boolean; desc: string }[];
  cost?: number;
}

export function ApiRefContent({
  endpoint,
  lang,
  setLang,
}: {
  endpoint: Endpoint | null;
  lang: 'curl' | 'node' | 'python' | 'php' | 'go';
  setLang: (l: 'curl' | 'node' | 'python' | 'php' | 'go') => void;
}) {
  if (!endpoint) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#1a1910] border border-[#262413] flex items-center justify-center mb-4">
          <BookOpen size={24} className="text-[#4a4a3a]" />
        </div>
        <p className="text-sm font-semibold text-white mb-1">Select an endpoint</p>
        <p className="text-xs text-[#6a6c5d] max-w-xs">
          Choose an endpoint from the sidebar to view its documentation and code examples.
        </p>
      </div>
    );
  }

  const snippet = buildCodeSnippet(lang, endpoint.method, `/api/v1${endpoint.path}`, endpoint.params, '');

  return (
    <div className="space-y-6">
      {/* Endpoint header */}
      <div className="bg-[#1a1910] border border-[#262413] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
              METHOD_COLORS[endpoint.method] || 'bg-gray-600 text-white'
            }`}
          >
            {endpoint.method}
          </span>
          <code className="text-xs font-mono font-bold text-white">{endpoint.path}</code>
          {endpoint.cost !== undefined && (
            <span className="ml-2 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
              {endpoint.cost === 0 ? 'Free' : `${endpoint.cost} token${endpoint.cost > 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        <p className="text-xs text-[#8a886a]">{endpoint.desc}</p>
      </div>

      {/* Parameters */}
      {endpoint.params.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-[#8a886a] uppercase tracking-widest mb-3">
            Parameters
          </h3>
          <ParamTable params={endpoint.params} />
        </div>
      )}

      {/* Authentication */}
      <div>
        <h3 className="text-xs font-bold text-[#8a886a] uppercase tracking-widest mb-3">
          Authentication
        </h3>
        <div className="bg-[#0d0c06] border border-[#262413] rounded-xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[#8a886a] text-[10px] font-bold">Header</span>
            <CopyButton text="X-API-Key: fidscript_live_your_key_here" />
          </div>
          <p>
            <span className="text-blue-400">X-API-Key</span>:{' '}
            <span className="text-yellow-400">fidscript_live_your_key_here</span>
          </p>
        </div>
      </div>

      {/* Base URL */}
      <div>
        <h3 className="text-xs font-bold text-[#8a886a] uppercase tracking-widest mb-3">
          Base URL
        </h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-[#13120d] border border-[#262413] px-4 py-3 rounded-xl text-[#c9d1d9]">
            {PUBLIC_API_BASE}
          </code>
          <CopyButton text={PUBLIC_API_BASE} />
        </div>
      </div>

      {/* Code examples */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-xs font-bold text-[#8a886a] uppercase tracking-widest">
            Code Examples
          </h3>
          <LangTabs active={lang} onChange={setLang} />
        </div>
        {/* Inline DocsCodeBlock to avoid extra import */}
        <pre className="bg-[#13120d] border border-[#262413] rounded-xl p-4 overflow-x-auto text-xs text-[#c9d1d9] font-mono">
          <code>{snippet}</code>
        </pre>
      </div>
    </div>
  );
}
