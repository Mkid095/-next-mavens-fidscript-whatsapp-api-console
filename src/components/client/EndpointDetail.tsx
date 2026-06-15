import { BookOpen } from 'lucide-react';
import { PUBLIC_API_BASE } from '../../data/apiEndpoints/index';
import { LANGUAGES, METHOD_COLORS, CopyButton, buildCodeSnippet, type Lang } from './docsHelpers.js';
import type { DocEndpoint } from './EndpointSidebar.js';

interface EndpointDetailProps {
  endpoint: DocEndpoint | null;
  activeLang: Lang;
  setActiveLang: (lang: Lang) => void;
  apiKey?: string;
}

export default function EndpointDetail({ endpoint, activeLang, setActiveLang, apiKey }: EndpointDetailProps) {
  if (!endpoint) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400 space-y-3">
        <BookOpen className="w-12 h-12 text-yellow-200" />
        <p className="font-bold text-forest-deep text-sm">Select an endpoint</p>
        <p className="text-xs text-graphite max-w-xs">Choose an endpoint from the left sidebar to view its documentation, parameters, and code examples.</p>
      </div>
    );
  }
  const snippet = buildCodeSnippet(activeLang, endpoint.method, endpoint.path, endpoint.params, apiKey || '');
  return (
    <div className="flex-1 overflow-y-auto bg-white border border-[#eaebe4] rounded-3xl shadow-sm flex flex-col">
      <div className="p-6 border-b border-[#eaebe4] bg-[#f9f9f2]">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${METHOD_COLORS[endpoint.method] || 'bg-gray-400 text-white'}`}>{endpoint.method}</span>
          <code className="text-xs font-mono font-bold text-forest-deep">{endpoint.path}</code>
          {endpoint.cost !== undefined && (
            <span className="ml-2 text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">{endpoint.cost === 0 ? 'Free' : `${endpoint.cost} token${endpoint.cost > 1 ? 's' : ''}`}</span>
          )}
        </div>
        <p className="text-xs text-graphite">{endpoint.desc}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {endpoint.params.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-forest-deep mb-3 uppercase tracking-wider text-[#3d3311]">Parameters</h4>
            <div className="border border-[#eaebe4] rounded-2xl overflow-hidden">
              <table className="w-full text-[11px]">
                <thead className="bg-[#f9f9f2]">
                  <tr>
                    <th className="text-left px-4 py-2 font-bold text-forest-deep">Name</th>
                    <th className="text-left px-4 py-2 font-bold text-forest-deep">Type</th>
                    <th className="text-left px-4 py-2 font-bold text-forest-deep">Required</th>
                    <th className="text-left px-4 py-2 font-bold text-forest-deep">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaebe4]">
                  {endpoint.params.map(p => (
                    <tr key={p.name} className="hover:bg-stone-50/50">
                      <td className="px-4 py-2.5 font-mono font-bold text-forest-deep">{p.name}</td>
                      <td className="px-4 py-2.5 font-mono text-stone-500 text-[10px]">{p.type}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.required ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-500'}`}>{p.required ? 'Required' : 'Optional'}</span>
                      </td>
                      <td className="px-4 py-2.5 text-graphite">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-bold text-forest-deep mb-3 uppercase tracking-wider text-[#3d3311]">Base URL</h4>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] font-mono bg-stone-100 border border-[#eaebe4] px-3 py-2 rounded-xl text-forest-deep">{PUBLIC_API_BASE}</code>
            <CopyButton text={PUBLIC_API_BASE} />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-forest-deep mb-3 uppercase tracking-wider text-[#3d3311]">Authentication</h4>
          <div className="bg-[#13120d] text-[#e3ded2] rounded-xl p-3 font-mono text-[11px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#b8ab81] text-[9px] font-bold">Header</span>
              <CopyButton text={`X-API-Key: ${apiKey || 'fidscript_live_your_key_here'}`} />
            </div>
            <p><span className="text-blue-400">X-API-Key</span>: <span className="text-yellow-300">{apiKey || 'fidscript_live_your_key_here'}</span></p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-forest-deep uppercase tracking-wider text-[#3d3311]">Code Examples</h4>
            <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  onClick={() => setActiveLang(l.id)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${activeLang === l.id ? 'bg-white text-forest-deep shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#13120d] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#1f1d0b] border-b border-[#2d2813]">
              <span className="text-[10px] font-mono text-[#8f834a] font-bold">{LANGUAGES.find(l => l.id === activeLang)?.label}</span>
              <CopyButton text={snippet} />
            </div>
            <pre className="p-4 text-[11px] font-mono text-yellow-200 overflow-x-auto whitespace-pre-wrap">{snippet}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
