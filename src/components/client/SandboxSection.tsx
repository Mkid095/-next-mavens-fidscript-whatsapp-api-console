import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronRight, ChevronDown, Search, Loader2, Play, RotateCcw, Terminal, Copy, Check, Zap, X, MessageSquare, Smartphone, Users, Settings, Building, Tag, Wrench, Compass, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { instancesApi } from '../../services/api';
import type { Instance } from '../../services/api';
import { API_ENDPOINTS, API_CATEGORIES, PUBLIC_API_BASE, type ApiEndpoint } from '../../data/apiEndpoints/index';

interface SandboxSectionProps {
  clientToken?: string;
  instances: Instance[];
  tokenBalance: number;
  onTokenDeduct: (n: number) => void;
}

// ─── Endpoint definitions ───────────────────────────────────────────────────

interface EndpointDef {
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
  path: string;
  name: string;
  desc: string;
  pathParams?: string[];
  bodyFields?: { key: string; label: string; type: 'string' | 'number' | 'boolean' | 'text'; placeholder?: string; required?: boolean }[];
  cost?: number;
  category: string;
}

interface CategoryGroup {
  name: string;
  icon: string;
  endpoints: EndpointDef[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageSquare: <MessageSquare className="w-4 h-4 text-yellow-600" />,
  Smartphone: <Smartphone className="w-4 h-4 text-yellow-600" />,
  Users: <Users className="w-4 h-4 text-yellow-600" />,
  Settings: <Settings className="w-4 h-4 text-yellow-600" />,
  Building: <Building className="w-4 h-4 text-yellow-600" />,
  Tag: <Tag className="w-4 h-4 text-yellow-600" />,
  Wrench: <Wrench className="w-4 h-4 text-yellow-600" />,
  Compass: <Compass className="w-4 h-4 text-yellow-600" />,
  Send: <Send className="w-4 h-4 text-yellow-600" />,
  Inbox: <Inbox className="w-4 h-4 text-yellow-600" />,
};

/** Derive Sandbox groups from the live registry. Only real /api/v1 routes. */
function toSandboxEndpoint(ep: ApiEndpoint): EndpointDef {
  return {
    method: ep.method,
    // Convert /api/v1/messages/text/:instance → /messages/text/:instanceName
    path: ep.path.replace('/api/v1', '').replace(':instance', ':instanceName'),
    name: ep.name,
    desc: ep.desc,
    pathParams: ep.pathParams.map(p => p.name),
    bodyFields: ep.bodyFields.map(f => ({
      key: f.key,
      label: f.label,
      type: f.type as 'string' | 'number' | 'boolean' | 'text',
      placeholder: f.placeholder || (f.enum ? f.enum.join(' | ') : ''),
      required: f.required,
    })),
    cost: ep.cost,
    category: ep.category,
  };
}

const ENDPOINT_GROUPS: CategoryGroup[] =
  API_CATEGORIES
    .filter(cat => cat.name !== 'Receiving')
    .map(cat => ({
      name: cat.name,
      icon: cat.icon,
      endpoints: API_ENDPOINTS
        .filter((ep: ApiEndpoint) => ep.category === cat.name && ep.path.startsWith('/api/v1'))
        .map(toSandboxEndpoint),
    }))
    .filter(g => g.endpoints.length > 0);

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-600 text-white',
  POST: 'bg-yellow-600 text-stone-950',
  DELETE: 'bg-red-600 text-white',
  PATCH: 'bg-orange-500 text-white',
  PUT: 'bg-purple-600 text-white',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SandboxSection({ clientToken, instances, tokenBalance, onTokenDeduct }: SandboxSectionProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Messaging']));
  const [search, setSearch] = useState('');
  const [bodyValues, setBodyValues] = useState<Record<string, string>>({});
  const [instanceName, setInstanceName] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ ep: EndpointDef; status: number; ts: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'send'>('explorer');

  const responseRef = useRef<HTMLDivElement>(null);

  // Auto-select first connected instance
  useEffect(() => {
    if (instances.length > 0 && !instanceName) {
      const connected = instances.find(i => i.status === 'connected');
      if (connected) setInstanceName(connected.name);
    }
  }, [instances]);

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectEndpoint = (ep: EndpointDef) => {
    setSelectedEndpoint(ep);
    setBodyValues({});
    setResponse(null);
    setResponseStatus(null);
  };

  const buildCurl = (): string => {
    if (!selectedEndpoint || !instanceName) return '';
    const base = PUBLIC_API_BASE;
    const path = selectedEndpoint.path.replace(':instanceName', instanceName);
    const method = selectedEndpoint.method;
    const lines = [`curl -X ${method} ${base}${path}`];
    lines.push(`  -H "X-API-Key: fidscript_live_xxxx"`);
    lines.push(`  -H "Content-Type: application/json"`);
    if (selectedEndpoint.bodyFields && selectedEndpoint.bodyFields.length > 0) {
      const body: Record<string, unknown> = {};
      selectedEndpoint.bodyFields.forEach(f => {
        if (bodyValues[f.key] !== undefined && bodyValues[f.key] !== '') {
          body[f.key] = f.type === 'number' ? Number(bodyValues[f.key]) : bodyValues[f.key];
        }
      });
      if (Object.keys(body).length > 0) {
        lines.push(`  -d '${JSON.stringify(body)}'`);
      }
    }
    return lines.join(' \\\n');
  };

  const handleExecute = async () => {
    if (!selectedEndpoint || !instanceName || !clientToken) return;
    setLoading(true);
    setResponse(null);
    setResponseStatus(null);

    try {
      const reqBody: Record<string, unknown> = {};
      if (selectedEndpoint.bodyFields) {
        selectedEndpoint.bodyFields.forEach(f => {
          if (bodyValues[f.key] !== undefined && bodyValues[f.key] !== '') {
            reqBody[f.key] = f.type === 'number' ? Number(bodyValues[f.key]) : bodyValues[f.key];
          }
        });
      }

      // Call the real /api/v1 endpoint directly with the client's JWT token
      // (sandbox uses the dashboard auth, not an API key — the backend issues a temporary key)
      const fullPath = selectedEndpoint.path.replace(':instanceName', instanceName);
      const res = await fetch(`${PUBLIC_API_BASE}${fullPath}`, {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`,
        },
        body: ['GET', 'HEAD'].includes(selectedEndpoint.method) ? undefined : JSON.stringify(reqBody),
      });

      const data = await res.json().catch(() => ({}));
      setResponseStatus(res.status);
      setResponse(JSON.stringify(data, null, 2));

      setHistory(prev => [{ ep: selectedEndpoint, status: res.status, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));

      if (selectedEndpoint.cost && selectedEndpoint.cost > 0) {
        onTokenDeduct(selectedEndpoint.cost);
      }
    } catch (err) {
      setResponseStatus(500);
      setResponse(JSON.stringify({ error: String(err) }, null, 2));
    }
    setLoading(false);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(buildCurl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredGroups = search
    ? ENDPOINT_GROUPS.map(g => ({
        ...g,
        endpoints: g.endpoints.filter(ep =>
          ep.name.toLowerCase().includes(search.toLowerCase()) ||
          ep.path.toLowerCase().includes(search.toLowerCase()) ||
          ep.desc.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(g => g.endpoints.length > 0)
    : ENDPOINT_GROUPS;

  return (
    <div className="space-y-4">
      {/* Instance selector bar */}
      <div className="bg-white border border-[#eaebe4] rounded-2xl px-4 py-3 flex items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-forest-deep">
          <Zap className="w-4 h-4 text-yellow-600" />
          <span>API Sandbox</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-500">
          <span>Container:</span>
          <select
            value={instanceName}
            onChange={e => setInstanceName(e.target.value)}
            className="px-2 py-1 border border-[#eaebe4] rounded-lg text-xs font-mono focus:outline-none focus:border-yellow-500"
          >
            <option value="">-- Select --</option>
            {instances.map(inst => (
              <option key={inst.id} value={inst.name}>{inst.name} ({inst.status})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-500 ml-auto">
          <span>Balance:</span>
          <span className="font-bold text-yellow-700">{tokenBalance.toLocaleString()} tokens</span>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '340px 1fr', minHeight: '600px', height: 'calc(100vh - 240px)' }}>
        {/* Left: endpoint browser */}
        <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex flex-col" style={{ maxHeight: '100%' }}>
          <div className="p-3 border-b border-[#eaebe4] bg-[#f9f9f2]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search endpoints..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredGroups.map(group => (
              <div key={group.name}>
                <button
                  onClick={() => toggleCategory(group.name)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-forest-deep bg-[#f9f9f2] border-b border-[#eaebe4] hover:bg-stone-100 transition-colors"
                >
                  <span className="text-stone-600">{ICON_MAP[group.icon]}</span>
                  <span>{group.name}</span>
                  <span className="ml-auto text-stone-400">{group.endpoints.length}</span>
                  {expandedCategories.has(group.name) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence>
                  {expandedCategories.has(group.name) && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      {group.endpoints.map(ep => (
                        <button
                          key={ep.path + ep.method}
                          onClick={() => selectEndpoint(ep)}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-[11px] hover:bg-stone-50 transition-colors text-left border-b border-[#eaebe4]/50 ${selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method ? 'bg-yellow-50 border-l-2 border-l-yellow-500' : ''}`}
                        >
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                          <div className="min-w-0">
                            <p className="font-bold text-forest-deep truncate">{ep.name}</p>
                            <p className="text-[9px] text-stone-400 font-mono truncate">{ep.path.replace(':instanceName', instanceName || ':instance')}</p>
                          </div>
                          {ep.cost !== undefined && ep.cost > 0 && (
                            <span className="ml-auto text-[9px] font-bold text-yellow-700 shrink-0">{ep.cost}t</span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Right: request builder + response */}
        <div className="flex flex-col gap-4">
          {selectedEndpoint ? (
            <>
              {/* Request builder */}
              <div className="bg-white border border-[#eaebe4] rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${METHOD_COLORS[selectedEndpoint.method]}`}>{selectedEndpoint.method}</span>
                      <code className="text-xs font-mono font-bold text-forest-deep">{selectedEndpoint.path.replace(':instanceName', instanceName || ':instance')}</code>
                    </div>
                    <p className="text-xs text-graphite">{selectedEndpoint.desc}</p>
                  </div>
                  {selectedEndpoint.cost !== undefined && selectedEndpoint.cost > 0 && (
                    <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-xl border border-yellow-200 shrink-0">{selectedEndpoint.cost} token{selectedEndpoint.cost > 1 ? 's' : ''}</span>
                  )}
                </div>

                {selectedEndpoint.pathParams && selectedEndpoint.pathParams.length > 0 && (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                    <p className="text-[9px] font-bold text-stone-500 uppercase mb-2">Path Parameter</p>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono text-stone-600">:instanceName</code>
                      <input
                        value={instanceName}
                        onChange={e => setInstanceName(e.target.value)}
                        placeholder="my-container"
                        className="flex-1 px-2 py-1 border border-[#eaebe4] rounded-lg text-xs font-mono focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>
                )}

                {selectedEndpoint.bodyFields && selectedEndpoint.bodyFields.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-stone-500 uppercase">Request Body</p>
                    {selectedEndpoint.bodyFields.map(field => (
                      <div key={field.key}>
                        <label className="block text-[10px] font-bold text-graphite mb-1">
                          {field.label} <span className="text-stone-400">{field.required ? '*' : '(optional)'}</span>
                        </label>
                        {field.type === 'text' ? (
                          <textarea
                            rows={3}
                            value={bodyValues[field.key] || ''}
                            onChange={e => setBodyValues(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500 resize-none"
                          />
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={bodyValues[field.key] || ''}
                            onChange={e => setBodyValues(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* curl preview */}
                <div className="bg-[#13120d] rounded-xl p-3 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-[#8f834a] uppercase">cURL</span>
                    <button onClick={handleCopyCurl} className="flex items-center gap-1 text-[9px] text-stone-400 hover:text-yellow-400 transition-colors">
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-yellow-200 overflow-x-auto whitespace-pre-wrap">{buildCurl()}</pre>
                </div>

                <button
                  onClick={handleExecute}
                  disabled={loading || !instanceName}
                  className="w-full flex items-center justify-center gap-2 bg-forest-deep hover:bg-[#33301a] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {loading ? 'Executing...' : 'Execute Request'}
                </button>
              </div>

              {/* Response viewer */}
              <div className="bg-[#13120d] border border-[#2d2813] rounded-3xl overflow-hidden shadow-lg flex flex-col" style={{ minHeight: '250px' }}>
                <div className="p-3 bg-[#1f1d0b] border-b border-[#353116] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-yellow-400" />
                    <span className="text-[11px] font-mono text-[#cbd4d0]">Response</span>
                    {responseStatus && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${responseStatus < 300 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {responseStatus}
                      </span>
                    )}
                  </div>
                  {response && (
                    <button onClick={() => { setResponse(null); setResponseStatus(null); }} className="text-stone-500 hover:text-white text-[10px] flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div ref={responseRef} className="p-4 flex-1 overflow-auto font-mono text-[11px] whitespace-pre-wrap bg-[#0d0d0a] text-yellow-100">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-yellow-600/60 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Executing request...
                    </div>
                  ) : response ? (
                    <code>{response}</code>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[#4a452c] gap-2 text-center">
                      <Terminal className="w-8 h-8" />
                      <p className="text-xs font-bold text-white">Ready to execute</p>
                      <p className="text-[10px] text-[#7d7756] max-w-xs">Fill in the parameters above and click Execute to see the real API response.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-[#eaebe4] rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-3" style={{ minHeight: '400px' }}>
              <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center">
                <Terminal className="w-8 h-8 text-yellow-300" />
              </div>
              <p className="font-bold text-forest-deep text-sm">Select an endpoint to start</p>
              <p className="text-xs text-graphite max-w-sm">Choose any FIDScript API endpoint from the browser on the left to build and execute a live request.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
