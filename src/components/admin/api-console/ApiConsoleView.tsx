import { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, ChevronRight, Compass, Send, Users, MessageSquare, UserCircle, Settings, Smartphone, Inbox } from 'lucide-react';
import ResponseViewer from './ResponseViewer';
import {
  API_CATEGORIES,
  type ApiEndpoint,
  type BodyField,
} from '../../../data/apiEndpoints/index';
import { instancesApi } from '../../../services/api';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Platform:  <Compass size={13} />,
  Messaging:  <Send size={13} />,
  Groups:    <Users size={13} />,
  Chats:     <MessageSquare size={13} />,
  Profile:   <UserCircle size={13} />,
  Settings:  <Settings size={13} />,
  Instance:  <Smartphone size={13} />,
  Receiving: <Inbox size={13} />,
};

function getAllEndpoints(): ApiEndpoint[] {
  // Lazy import to avoid circular issues — registry is pure data
  const mod = require('../../../data/apiEndpoints/index') as {
    messagingEndpoints: ApiEndpoint[];
    platformEndpoints: ApiEndpoint[];
    receivingEndpoints: ApiEndpoint[];
    groupEndpoints: ApiEndpoint[];
    chatEndpoints: ApiEndpoint[];
    profileEndpoints: ApiEndpoint[];
    settingsEndpoints: ApiEndpoint[];
    instanceEndpoints: ApiEndpoint[];
  };
  return [
    ...mod.platformEndpoints,
    ...mod.messagingEndpoints,
    ...mod.groupEndpoints,
    ...mod.chatEndpoints,
    ...mod.profileEndpoints,
    ...mod.settingsEndpoints,
    ...mod.instanceEndpoints,
    ...mod.receivingEndpoints,
  ];
}

function FieldInput({ field, value, onChange }: { field: BodyField; value: string; onChange: (v: string) => void }) {
  if (field.type === 'text' || field.type === 'string') {
    return (
      <div key={field.key}>
        <label className="block text-[9px] font-bold text-[#6e684a] uppercase tracking-wider mb-1">
          {field.label} {field.required ? '*' : ''}
        </label>
        {field.enum ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2.5 py-2 border border-[#2d2813] text-[#a8a99e] bg-[#181711] rounded-lg text-xs focus:outline-none"
          >
            <option value="">Select…</option>
            {field.enum.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={field.type === 'text' ? 3 : 1}
            placeholder={field.placeholder}
            className="w-full px-2.5 py-2 border border-[#2d2813] text-[#a8a99e] bg-[#181711] rounded-lg text-xs font-mono focus:outline-none resize-none"
          />
        )}
        {field.desc && <p className="mt-0.5 text-[9px] text-[#5a554a]">{field.desc}</p>}
      </div>
    );
  }
  if (field.type === 'number') {
    return (
      <div key={field.key}>
        <label className="block text-[9px] font-bold text-[#6e684a] uppercase tracking-wider mb-1">
          {field.label} {field.required ? '*' : ''}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-2.5 py-2 border border-[#2d2813] text-[#a8a99e] bg-[#181711] rounded-lg text-xs font-mono focus:outline-none"
        />
      </div>
    );
  }
  if (field.type === 'boolean') {
    return (
      <div key={field.key} className="flex items-center gap-2">
        <input
          type="checkbox"
          id={field.key}
          checked={value === 'true'}
          onChange={(e) => onChange(String(e.target.checked))}
          className="w-3.5 h-3.5 rounded border-[#2d2813] text-yellow-500 focus:ring-yellow-500"
        />
        <label htmlFor={field.key} className="text-xs text-[#a8a99e]">{field.label}</label>
      </div>
    );
  }
  return null;
}

function buildBody(endpoint: ApiEndpoint, values: Record<string, string>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const field of endpoint.bodyFields) {
    if (field.type === 'boolean') {
      body[field.key] = values[field.key] === 'true';
    } else if (field.type === 'number') {
      body[field.key] = values[field.key] ? parseFloat(values[field.key]) : undefined;
    } else if (values[field.key] !== '' && values[field.key] !== undefined) {
      body[field.key] = values[field.key];
    }
  }
  return body;
}

export default function ApiConsoleView() {
  const [activeCategory, setActiveCategory] = useState('Messaging');
  const [selectedId, setSelectedId] = useState<string>('');
  const [instanceName, setInstanceName] = useState<string>('');
  const [instances, setInstances] = useState<{ name: string }[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string>('');
  const [adminToken, setAdminToken] = useState<string>('');

  const allEndpoints = getAllEndpoints();
  const categories = API_CATEGORIES;

  const filteredEndpoints = allEndpoints.filter((e) => e.category === activeCategory);
  const selectedEndpoint = allEndpoints.find((e) => e.id === selectedId);

  useEffect(() => {
    const token = localStorage.getItem('fidscript_admin_token') || '';
    setAdminToken(token);
    // Fetch all instances across all clients for the dropdown
    instancesApi.getAll().then((r) => {
      if (r.success && r.data) setInstances(r.data.map((i: any) => ({ name: i.name })));
    });
  }, []);

  // Reset param values when endpoint changes
  useEffect(() => {
    if (!selectedEndpoint) return;
    const defaults: Record<string, string> = {};
    for (const f of selectedEndpoint.bodyFields) {
      if (f.default !== undefined) defaults[f.key] = String(f.default);
      else if (f.type === 'boolean') defaults[f.key] = 'false';
      else defaults[f.key] = '';
    }
    setParamValues(defaults);
  }, [selectedId]);

  const handleParamChange = useCallback((key: string, val: string) => {
    setParamValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const getResolvedPath = useCallback((): string => {
    if (!selectedEndpoint) return '';
    let path = selectedEndpoint.path;
    // Replace :instance token
    if (instanceName) path = path.replace(':instance', instanceName);
    return path;
  }, [selectedEndpoint, instanceName]);

  const handleRunRequest = async () => {
    if (!selectedEndpoint || !adminToken) return;
    setIsRunning(true);
    setResponseCode(null);
    setResponseBody('');

    const resolvedPath = getResolvedPath();
    const body = buildBody(selectedEndpoint, paramValues);

    try {
      const res = await fetch('/api/admin/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          method: selectedEndpoint.method,
          path: resolvedPath,
          body: Object.keys(body).length > 0 ? body : undefined,
        }),
      });
      setResponseCode(res.status);
      const text = await res.text();
      try { setResponseBody(JSON.stringify(JSON.parse(text), null, 2)); }
      catch { setResponseBody(text); }
    } catch (err) {
      setResponseCode(0);
      setResponseBody(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setIsRunning(false);
  };

  const methodColor = (m: string) => {
    if (m === 'GET') return 'text-blue-400 bg-blue-900/40 border-blue-900/50';
    if (m === 'POST') return 'text-emerald-400 bg-emerald-900/40 border-emerald-900/50';
    if (m === 'PATCH') return 'text-yellow-400 bg-yellow-900/40 border-yellow-900/50';
    return 'text-[#6e684a] bg-[#181711] border-[#2d2813]';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#cbd3cf]">FIDScript REST Sandbox</h1>
        <p className="text-xs text-[#a8a99e] mt-1">
          Execute live requests against the FIDScript WhatsApp API. All requests use your admin session.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Category sidebar */}
        <div className="w-44 shrink-0 space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => { setActiveCategory(cat.name); setSelectedId(''); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeCategory === cat.name
                  ? 'bg-yellow-500 text-[#181711]'
                  : 'text-[#6e684a] hover:bg-[#2d2813]'
              }`}
            >
              {CATEGORY_ICONS[cat.name]}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Endpoint list */}
        <div className="w-72 shrink-0 space-y-1 max-h-[70vh] overflow-y-auto pr-1">
          {filteredEndpoints.map((ep) => (
            <button
              key={ep.id}
              onClick={() => setSelectedId(ep.id)}
              className={`w-full text-left p-2.5 rounded-xl border text-xs flex flex-col gap-0.5 transition-all ${
                selectedId === ep.id
                  ? 'bg-emerald-900/40 text-emerald-300 border-emerald-900/50'
                  : 'bg-[#1a1915] text-[#a8a99e] border-[#2d2813] hover:bg-[#2d2813]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${methodColor(ep.method)}`}>
                  {ep.method}
                </span>
                <span className="font-mono font-semibold truncate">{ep.path}</span>
              </span>
              <span className="text-[10px] text-[#5a554a] pl-[52px] truncate">{ep.desc}</span>
            </button>
          ))}
        </div>

        {/* Request builder + response */}
        <div className="flex-1 min-w-0">
          {!selectedEndpoint ? (
            <div className="flex items-center justify-center h-48 text-[#5a554a] text-xs">
              Select an endpoint from the list to build a request
            </div>
          ) : (
            <div className="space-y-4">
              {/* Path + instance */}
              <div className="rounded-xl border border-[#2d2813] bg-[#1a1915] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${methodColor(selectedEndpoint.method)}`}>
                    {selectedEndpoint.method}
                  </span>
                  <code className="font-mono text-xs text-[#a8a99e] bg-[#181711] px-2 py-1 rounded">
                    {getResolvedPath() || selectedEndpoint.path}
                  </code>
                </div>

                {selectedEndpoint.path.includes(':instance') && (
                  <div>
                    <label className="block text-[9px] font-bold text-[#6e684a] uppercase tracking-wider mb-1">
                      Container *
                    </label>
                    <select
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#2d2813] bg-[#181711] rounded-lg text-xs text-[#a8a99e] focus:outline-none"
                    >
                      <option value="">Select container…</option>
                      {instances.map((i) => (
                        <option key={i.name} value={i.name}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Body fields */}
                {selectedEndpoint.bodyFields.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedEndpoint.bodyFields.map((field) => (
                      <FieldInput
                        key={field.key}
                        field={field}
                        value={paramValues[field.key] ?? ''}
                        onChange={(v) => handleParamChange(field.key, v)}
                      />
                    ))}
                  </div>
                )}

                {selectedEndpoint.bodyFields.length === 0 && (
                  <p className="text-[10px] text-[#5a554a] italic">No request body</p>
                )}

                <button
                  onClick={handleRunRequest}
                  disabled={isRunning || (selectedEndpoint.path.includes(':instance') && !instanceName)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] rounded-xl text-xs font-bold disabled:opacity-50 transition-opacity"
                >
                  {isRunning ? <><RefreshCw size={13} className="animate-spin" /> Running…</> : <><Play size={13} /> Run Request</>}
                </button>
              </div>

              <ResponseViewer
                isRunning={isRunning}
                responseCode={responseCode}
                responseBody={responseBody}
                endpointPath={getResolvedPath() || selectedEndpoint.path}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
