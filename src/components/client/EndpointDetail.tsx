import React from 'react';
import { BookOpen } from 'lucide-react';
import { PUBLIC_API_BASE } from '../../data/apiEndpoints/index';
import { LANGUAGES, METHOD_COLORS, buildCodeSnippet, type Lang } from './docsHelpers.js';
import { CopyButton } from '../shared/CopyButton.js';
import type { DocEndpoint } from './EndpointSidebar.js';

interface EndpointDetailProps {
  endpoint: DocEndpoint | null;
  activeLang: Lang;
  setActiveLang: (lang: Lang) => void;
  apiKey?: string;
}

/** Method-pill + path + cost badge header. */
function EndpointHeader({ endpoint }: { endpoint: DocEndpoint }) {
  return (
    <div className="flex items-center gap-2 mb-2 flex-wrap">
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${METHOD_COLORS[endpoint.method] || 'bg-[#2d2813] text-[#a8a99e]'}`}>{endpoint.method}</span>
      <code className="text-xs font-mono font-bold text-[#cbd3cf] break-all">{endpoint.path}</code>
      {endpoint.cost !== undefined && (
        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-900/40 px-2 py-0.5 rounded-full border border-yellow-900/50">
          {endpoint.cost === 0 ? 'Free' : `${endpoint.cost} token${endpoint.cost > 1 ? 's' : ''}`}
        </span>
      )}
    </div>
  );
}

/** Parameters table — kept compact. */
function ParamsTable({ params }: { params: DocEndpoint['params'] }) {
  if (params.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-bold text-[#cbd3cf] mb-3 uppercase tracking-wider">Parameters</h4>
      <div className="border border-[#2d2813] rounded-2xl overflow-hidden">
        <table className="w-full text-[11px]">
          <thead className="bg-[#181711]">
            <tr>
              {['Name', 'Type', 'Required', 'Description'].map(h => (
                <th key={h} className="text-left px-4 py-2 font-bold text-[#a8a99e]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d2813]">
            {params.map(p => (
              <tr key={p.name} className="hover:bg-[#2d2813]/50">
                <td className="px-4 py-2.5 font-mono font-bold text-[#cbd3cf]">{p.name}</td>
                <td className="px-4 py-2.5 font-mono text-[#6e684a] text-[10px]">{p.type}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    p.required
                      ? 'bg-red-900/40 text-red-400 border border-red-900/50'
                      : 'bg-[#2d2813] text-[#6e684a]'
                  }`}>{p.required ? 'Required' : 'Optional'}</span>
                </td>
                <td className="px-4 py-2.5 text-[#a8a99e]">{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EndpointDetail({ endpoint, activeLang, setActiveLang, apiKey }: EndpointDetailProps) {
  if (!endpoint) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#5a554a] space-y-3">
        <BookOpen className="w-12 h-12 text-[#3d3a1e]" />
        <p className="font-bold text-[#cbd3cf] text-sm">Select an endpoint</p>
        <p className="text-xs text-[#6e684a] max-w-xs">Choose an endpoint from the left sidebar to view its documentation, parameters, and code examples.</p>
      </div>
    );
  }

  const snippet = buildCodeSnippet(activeLang, endpoint.method, endpoint.path, endpoint.params, apiKey || '');
  const activeLangLabel = LANGUAGES.find(l => l.id === activeLang)?.label ?? activeLang;

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-[#1a1915] border border-[#2d2813] rounded-3xl shadow-sm flex flex-col">
      <div className="p-4 sm:p-6 border-b border-[#2d2813] bg-[#181711]">
        <EndpointHeader endpoint={endpoint} />
        <p className="text-xs text-[#6e684a]">{endpoint.desc}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <ParamsTable params={endpoint.params} />

        <div>
          <h4 className="text-xs font-bold text-[#cbd3cf] mb-3 uppercase tracking-wider">Base URL</h4>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 text-[11px] font-mono bg-[#181711] border border-[#2d2813] px-3 py-2 rounded-xl text-[#cbd3cf] truncate">{PUBLIC_API_BASE}</code>
            <CopyButton text={PUBLIC_API_BASE} />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-[#cbd3cf] mb-3 uppercase tracking-wider">Authentication</h4>
          <div className="bg-[#13120d] text-[#e3ded2] rounded-xl p-3 font-mono text-[11px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#b8ab81] text-[9px] font-bold">Header</span>
              <CopyButton text={`X-API-Key: ${apiKey || 'fidscript_live_your_key_here'}`} />
            </div>
            <p><span className="text-blue-400">X-API-Key</span>: <span className="text-yellow-300 break-all">{apiKey || 'fidscript_live_your_key_here'}</span></p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-[#cbd3cf] uppercase tracking-wider">Code Examples</h4>
            <div className="flex items-center gap-1 bg-[#181711] border border-[#2d2813] rounded-xl p-1 flex-wrap">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  onClick={() => setActiveLang(l.id)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    activeLang === l.id
                      ? 'bg-yellow-500 text-[#181711] shadow-sm'
                      : 'text-[#6e684a] hover:text-[#a8a99e]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#13120d] border border-[#2d2813] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#1f1d0b] border-b border-[#2d2813]">
              <span className="text-[10px] font-mono text-[#8f834a] font-bold uppercase tracking-wider">{activeLangLabel}</span>
              <CopyButton text={snippet} />
            </div>
            <pre className="p-4 text-[11px] font-mono text-yellow-200 overflow-x-auto whitespace-pre">{snippet}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}