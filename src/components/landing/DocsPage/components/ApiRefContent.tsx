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
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-[#f8f8f8] border border-[#e5e5e5] flex items-center justify-center mb-4">
          <BookOpen size={24} className="text-[#a0a0a0]" />
        </div>
        <p className="text-sm font-semibold text-[#1a1a1a] mb-1">Select an endpoint</p>
        <p className="text-xs text-[#525252] max-w-xs">
          Choose an endpoint from the sidebar to view its documentation and code examples.
        </p>
      </div>
    );
  }

  const snippet = buildCodeSnippet(lang, endpoint.method, `/api/v1${endpoint.path}`, endpoint.params, '');

  return (
    <div className="space-y-6">
      {/* Endpoint header */}
      <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
              METHOD_COLORS[endpoint.method] || 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {endpoint.method}
          </span>
          <code className="text-xs font-mono font-bold text-[#1a1a1a]">{endpoint.path}</code>
          {endpoint.cost !== undefined && (
            <span className="ml-2 text-[10px] font-bold text-[#f97316] bg-[#fff7ed] border border-[#fed7aa] px-2 py-0.5 rounded-full">
              {endpoint.cost === 0 ? 'Free' : `${endpoint.cost} token${endpoint.cost > 1 ? 's' : ''}`}
            </span>
          )}
        </div>
        <p className="text-xs text-[#525252]">{endpoint.desc}</p>
      </div>

      {/* Parameters */}
      {endpoint.params.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-[#525252] uppercase tracking-widest mb-3">
            Parameters
          </h3>
          <ParamTable params={endpoint.params} />
        </div>
      )}

      {/* Authentication */}
      <div>
        <h3 className="text-xs font-bold text-[#525252] uppercase tracking-widest mb-3">
          Authentication
        </h3>
        <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-[#a0a0a0]">Header</span>
            <CopyButton text="X-API-Key: fidscript_live_your_key_here" />
          </div>
          <p>
            <span className="text-[#f97316]">X-API-Key</span>:{' '}
            <span className="text-[#525252]">fidscript_live_your_key_here</span>
          </p>
        </div>
      </div>

      {/* Base URL */}
      <div>
        <h3 className="text-xs font-bold text-[#525252] uppercase tracking-widest mb-3">
          Base URL
        </h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-[#f8f8f8] border border-[#e5e5e5] px-4 py-3 rounded-xl text-[#525252]">
            {PUBLIC_API_BASE}
          </code>
          <CopyButton text={PUBLIC_API_BASE} />
        </div>
      </div>

      {/* Code examples */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-xs font-bold text-[#525252] uppercase tracking-widest">
            Code Examples
          </h3>
          <LangTabs active={lang} onChange={setLang} />
        </div>
        <pre className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl p-4 overflow-x-auto text-xs font-mono text-[#1a1a1a]">
          <code>{snippet}</code>
        </pre>
      </div>
    </div>
  );
}
