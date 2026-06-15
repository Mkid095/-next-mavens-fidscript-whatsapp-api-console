import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronRight, ChevronDown, Search, Loader2, Play, RotateCcw, Terminal, Copy, Check, Zap, X, MessageSquare, Smartphone, Users, Settings, Building, Tag, Wrench, Compass, Inbox, Key, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { instancesApi, clientKeysApi } from '../../services/api';
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
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; key_prefix?: string; status: string }>>([]);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const responseRef = useRef<HTMLDivElement>(null);

  // Fetch API keys
  useEffect(() => {
    if (!clientToken) return;
    clientKeysApi.getAll().then(res => {
      if (res.success && res.data) {
        setApiKeys(res.data.filter((k: { status: string }) => k.status === 'Active'));
      }
    });
  }, [clientToken]);

  // Auto-select first connected instance
  useEffect(() => {
    if (instances.length > 0 && !instanceName) {
      const connected = instances.find(i => i.status === 'connected');
      if (connected) setInstanceName(connected.name);
    }
  }, [instances]);

  // Auto-select first active key
  useEffect(() => {
    if (apiKeys.length > 0 && !selectedKeyId) {
      setSelectedKeyId(apiKeys[0].id);
    }
  }, [apiKeys]);

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
    lines.push(`  -H "X-API-Key: <your-key>"`);
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

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(buildCurl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMediaUpload = async (fieldKey: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*,application/pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !clientToken) return;
      setUploadingMedia(true);
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await fetch('/api/uploads/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();
        if (data.success && data.data?.url) {
          setBodyValues(prev => ({ ...prev, [fieldKey]: data.data.url }));
        } else {
          alert(data.error || 'Upload failed');
        }
      } catch (err) {
        alert(String(err));
      } finally {
        setUploadingMedia(false);
      }
    };
    input.click();
  };

  const handleExecute = async () => {
    if (!selectedEndpoint || !instanceName || !clientToken || !selectedKeyId) return;
    setLoading(true);
    setResponse(null);
    setResponseStatus(null);

    try {
      const reqBody: Record<string, unknown> = {
        method: selectedEndpoint.method,
        endpoint: selectedEndpoint.path,
        instanceName,
        keyId: selectedKeyId,
      };
      if (selectedEndpoint.bodyFields) {
        selectedEndpoint.bodyFields.forEach(f => {
          if (bodyValues[f.key] !== undefined && bodyValues[f.key] !== '') {
            reqBody[f.key] = f.type === 'number' ? Number(bodyValues[f.key]) : bodyValues[f.key];
          }
        });
      }

      // Route through /api/sandbox/exec which attaches the correct API key server-side
      const res = await fetch('/api/sandbox/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`,
        },
        body: JSON.stringify(reqBody),
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
      {/* Instance + key selector bar */}
      <div className="bg-white border border-[#eaebe4] rounded-2xl px-4 py-3 flex flex-wrap items-center gap-4 shadow-sm">
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

        <div className="flex items-center gap-2 text-[10px] text-stone-500">
          <Key className="w-3.5 h-3.5 text-stone-400" />
          <span>API Key:</span>
          <select
            value={selectedKeyId}
            onChange={e => setSelectedKeyId(e.target.value)}
            className="px-2 py-1 border border-[#eaebe4] rounded-lg text-xs font-mono focus:outline-none focus:border-yellow-500 min-w-[140px]"
          >
            <option value="">-- Select --</option>
            {apiKeys.map(k => (
              <option key={k.id} value={k.id}>{k.name} ({k.key_prefix || 'fidscript_live_…'})</option>
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
                    <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200 shrink-0">{selectedEndpoint.cost} token{selectedEndpoint.cost > 1 ? 's' : ''}</span>
                  )}
                </div>

                {/* Body fields */}
                {selectedEndpoint.bodyFields && selectedEndpoint.bodyFields.length > 0 && (
                  <div className="grid gap-3">
                    {selectedEndpoint.bodyFields.map(field => (
                      <div key={field.key}>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        {field.type === 'text' ? (
                          <textarea
                            value={bodyValues[field.key] || ''}
                            onChange={e => setBodyValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            rows={3}
                            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500 resize-none"
                          />
                        ) : field.type === 'boolean' ? (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={bodyValues[field.key] === 'true'}
                              onChange={e => setBodyValues(prev => ({ ...prev, [field.key]: String(e.target.checked) }))}
                              className="w-4 h-4 accent-yellow-600"
                            />
                            <span className="text-xs text-stone-500">{field.placeholder || 'true / false'}</span>
                          </label>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type={field.type === 'number' ? 'number' : 'text'}
                              value={bodyValues[field.key] || ''}
                              onChange={e => setBodyValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder={field.placeholder}
                              className="flex-1 px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
                            />
                            {/* Show upload button for media URL fields */}
                            {(field.key.includes('media') || field.key.includes('url') || field.key.includes('image') || field.key.includes('audio') || field.key.includes('video') || field.key.includes('sticker')) && (
                              <button
                                onClick={() => handleMediaUpload(field.key)}
                                disabled={uploadingMedia}
                                className="flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                                title="Upload file"
                              >
                                {uploadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                Upload
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Execute */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleExecute}
                    disabled={loading || !instanceName || !selectedKeyId}
                    className="flex items-center gap-2 px-4 py-2 bg-forest-deep hover:bg-[#33301a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {loading ? 'Executing...' : 'Execute Request'}
                  </button>
                  <button
                    onClick={handleCopyCurl}
                    className="flex items-center gap-1.5 px-3 py-2 border border-[#eaebe4] hover:border-yellow-300 text-stone-600 text-xs font-bold rounded-xl transition-colors"
                  >
                    {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy cURL</>}
                  </button>
                </div>
              </div>

              {/* Response */}
              {response !== null && (
                <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#f9f9f2] border-b border-[#eaebe4]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-stone-500" />
                      <span className="text-[10px] font-bold text-stone-600">Response</span>
                      {responseStatus !== null && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${responseStatus < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {responseStatus}
                        </span>
                      )}
                    </div>
                    <button onClick={() => { setResponse(null); setResponseStatus(null); }} className="text-stone-400 hover:text-black">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div ref={responseRef} className="flex-1 overflow-auto p-4">
                    <pre className="text-[11px] font-mono text-stone-700 whitespace-pre-wrap break-all">{response}</pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white border border-[#eaebe4] rounded-3xl text-center p-8 text-stone-400 space-y-3 shadow-sm">
              <Compass className="w-12 h-12 text-yellow-200" />
              <p className="font-bold text-forest-deep text-sm">Select an endpoint to test</p>
              <p className="text-xs text-graphite max-w-xs">Choose an endpoint from the left panel, fill in the parameters, and execute a live request.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
