import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Copy, Check, Terminal, Code2, BookOpen,
  Search, Menu, X, ExternalLink, ChevronRight,
  Zap, MessageSquare, Users, Bell, Settings, Shield, Globe
} from 'lucide-react';
import { API_ENDPOINTS, API_CATEGORIES, PUBLIC_API_BASE } from '../../data/apiEndpoints/index.js';
import type { ApiEndpoint, BodyField } from '../../data/apiEndpoints/index.js';

/* ─────────────────────────────────────────────────────────
   SHARED COMPONENTS (used by both client dashboard & public docs)
   Copied from client/docsHelpers.tsx with brand dark theme
   ───────────────────────────────────────────────────────── */

export type Lang = 'curl' | 'node' | 'python' | 'php' | 'go';

export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
  { id: 'go', label: 'Go' },
];

export const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-blue-600 text-white',
  POST:   'bg-yellow-600 text-stone-950',
  DELETE: 'bg-red-600 text-white',
  PATCH:  'bg-orange-500 text-white',
  PUT:    'bg-purple-600 text-white',
};

interface ParamRow { name: string; type: string; required: boolean; desc: string }

function flattenFields(fields: BodyField[], prefix = ''): ParamRow[] {
  return fields.flatMap(f => {
    const name = prefix ? `${prefix}.${f.key}` : f.key;
    if (f.fields) return flattenFields(f.fields, name);
    return [{ name, type: f.type, required: !!f.required, desc: f.desc || '' }];
  });
}

export function buildCodeSnippet(lang: Lang, method: string, path: string, params: ParamRow[], apiKey: string): string {
  const base = PUBLIC_API_BASE;
  const cleanPath = path.replace(':instance', 'my-instance');
  const fullUrl = `${base}${cleanPath}`;
  const key = apiKey || 'fidscript_live_your_key_here';
  const buildBody = () => {
    const obj: Record<string, string> = {};
    params.filter(p => !['boolean','string'].includes(p.type) && !p.type.endsWith(']')).forEach(p => { obj[p.name] = `<${p.name}>`; });
    params.filter(p => p.type.endsWith(']')).forEach(p => { obj[p.name] = `[${p.name}]`; });
    return JSON.stringify(obj, null, 2);
  };
  const b = buildBody();
  switch (lang) {
    case 'curl': return `curl -X ${method} ${fullUrl} \\\n  -H "X-API-Key: ${key}" \\\n  -H "Content-Type: application/json" \\\n  -d '${b.replace(/"/g, '\\"')}'`;
    case 'node': return `const response = await fetch("${fullUrl}", {\n  method: "${method}",\n  headers: {\n    "X-API-Key": "${key}",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${b})\n});\nconst data = await response.json();\nconsole.log(data);`;
    case 'python': return `import requests\n\nurl = "${fullUrl}"\nheaders = {\n    "X-API-Key": "${key}",\n    "Content-Type": "application/json"\n}\npayload = ${b.replace(/"/g, '"')}\n\nresponse = requests.${method.toLowerCase()}(url, json=payload, headers=headers)\nprint(response.json())`;
    case 'php': return `<?php\n$url = "${fullUrl}";\n$data = ${b};\n\n$ch = curl_init($url);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    "X-API-Key: ${key}",\n    "Content-Type: application/json"\n]);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n$response = curl_exec($ch);\ncurl_close($ch);\nprint_r(json_decode($response, true));`;
    case 'go': return `package main\n\nimport (\n    "bytes"\n    "encoding/json"\n    "fmt"\n    "net/http"\n)\n\nfunc main() {\n    payload := map[string]interface{}{\n${params.map(p => `        "${p.name}": "<${p.name}>"`).join(',\n')}\n    }\n    body, _ := json.Marshal(payload)\n\n    req, _ := http.NewRequest("${method}", "${fullUrl}", bytes.NewBuffer(body))\n    req.Header.Set("X-API-Key", "${key}")\n    req.Header.Set("Content-Type", "application/json")\n\n    client := &http.Client{}\n    resp, _ := client.Do(req)\n    defer resp.Body.Close()\n}`;
    default: return '';
  }
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8a886a] hover:text-white bg-[#1e1c10] border border-[#262413] rounded-lg transition-colors cursor-pointer"
    >
      {copied ? <><Check size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   DOC GROUPS from registry
   ───────────────────────────────────────────────────────── */

const DOC_GROUPS = API_CATEGORIES
  .filter(cat => cat.name !== 'Receiving')
  .map(cat => ({
    name: cat.name,
    icon: cat.icon,
    endpoints: API_ENDPOINTS
      .filter((ep: ApiEndpoint) => ep.category === cat.name && ep.path.startsWith('/api/v1'))
      .map((ep: ApiEndpoint) => ({
        method: ep.method,
        path: ep.path.replace('/api/v1', '').replace(':instance', ':instanceName'),
        name: ep.name,
        desc: ep.desc,
        params: flattenFields(ep.bodyFields),
        cost: ep.cost,
        category: ep.category,
      })),
  }))
  .filter(g => g.endpoints.length > 0);

/* ─────────────────────────────────────────────────────────
   GUIDE SECTIONS (static content pages)
   ───────────────────────────────────────────────────────── */

const GUIDES = [
  { id: 'quickstart',     label: 'Quick Start' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'webhooks',       label: 'Webhooks' },
  { id: 'rate-limits',    label: 'Rate Limits' },
  { id: 'sdks',           label: 'SDKs' },
];

/* ─────────────────────────────────────────────────────────
   TOP-LEVEL NAV state
   activeTab: 'guides' | 'api-reference' | 'changelog'
   ───────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────
   SECTION LABELS for docs sidebar
   ───────────────────────────────────────────────────────── */
const SECTION_ICONS: Record<string, React.ReactNode> = {
  'Getting Started': <Zap size={13} />,
  'Messaging':       <MessageSquare size={13} />,
  'Instances':       <Settings size={13} />,
  'Contacts':        <Users size={13} />,
  'Platform':        <Globe size={13} />,
  'Groups':          <Users size={13} />,
  'Settings':        <Settings size={13} />,
  'Payments':        <Bell size={13} />,
  'Security':        <Shield size={13} />,
};

/* ─────────────────────────────────────────────────────────
   MOBILE MENU SIDEBAR
   ───────────────────────────────────────────────────────── */
function MobileSidebar({
  open, onClose,
  activeTab, setActiveTab,
  activeSection, setActiveSection,
  onSelectGuide, onSelectEndpoint,
}: {
  open: boolean; onClose: () => void;
  activeTab: string; setActiveTab: (t: string) => void;
  activeSection: string; setActiveSection: (s: string) => void;
  onSelectGuide: (id: string) => void; onSelectEndpoint: (ep: typeof DOC_GROUPS[0]['endpoints'][0]) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-64 h-full bg-[#11110a] border-r border-[#262413] pt-[52px] overflow-y-auto"
          >
            <div className="py-3">
              {/* Tab switcher */}
              <div className="px-3 mb-2">
                <div className="flex bg-[#1a1910] rounded-xl p-1">
                  {['guides', 'api-reference'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === tab ? 'bg-yellow-500 text-stone-950' : 'text-[#8a886a]'}`}>
                      {tab === 'guides' ? 'Guides' : 'API Ref'}
                    </button>
                  ))}
                </div>
              </div>
              {activeTab === 'guides' ? (
                <div>
                  {GUIDES.map(g => (
                    <button key={g.id} onClick={() => { onSelectGuide(g.id); onClose(); }} className={`w-full text-left px-4 py-2.5 text-sm border-b border-[#1e1c10] ${activeSection === g.id ? 'text-yellow-500 font-semibold' : 'text-[#8a886a]'}`}>
                      {g.label}
                    </button>
                  ))}
                </div>
              ) : (
                DOC_GROUPS.map(group => (
                  <div key={group.name}>
                    <button onClick={() => setActiveSection(group.name === activeSection ? '' : group.name)} className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b border-[#1e1c10] ${activeSection === group.name ? 'text-yellow-500' : 'text-[#6a6c5d]'}`}>
                      {SECTION_ICONS[group.name] || <BookOpen size={13} />}
                      {group.name}
                      <span className="ml-auto text-[10px]">{group.endpoints.length}</span>
                    </button>
                    {activeSection === group.name && group.endpoints.map(ep => (
                      <button key={ep.path} onClick={() => { onSelectEndpoint(ep); onClose(); }} className="w-full flex items-center gap-2 px-4 py-2 pl-8 text-xs text-[#8a886a] hover:text-white border-b border-[#1a1910]">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono ${METHOD_COLORS[ep.method] || 'bg-gray-600 text-white'}`}>{ep.method}</span>
                        <span className="truncate">{ep.name}</span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────
   CODE BLOCK
   ───────────────────────────────────────────────────────── */
function DocsCodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#262413]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1c10] border-b border-[#262413]">
        <span className="text-xs font-mono text-[#8a886a]">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-5 text-xs font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed" style={{ background: '#13120d' }}>{code}</pre>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PARAM TABLE
   ───────────────────────────────────────────────────────── */
function ParamTable({ params }: { params: ParamRow[] }) {
  if (params.length === 0) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-[#262413]">
      <table className="w-full text-xs">
        <thead className="bg-[#1a1910]">
          <tr>
            {['Name','Type','Required','Description'].map(h => (
              <th key={h} className="text-left px-4 py-2.5 font-bold text-[#8a886a]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#262413]">
          {params.map(p => (
            <tr key={p.name} className="hover:bg-[#1a1910]/50">
              <td className="px-4 py-2.5 font-mono font-bold text-yellow-500">{p.name}</td>
              <td className="px-4 py-2.5 font-mono text-[#8a886a]">{p.type}</td>
              <td className="px-4 py-2.5">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.required ? 'bg-red-950 text-red-400' : 'bg-[#1a1910] text-[#6a6c5d]'}`}>{p.required ? 'Required' : 'Optional'}</span>
              </td>
              <td className="px-4 py-2.5 text-[#8a886a]">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   LANGUAGE TABS
   ───────────────────────────────────────────────────────── */
function LangTabs({ active, onChange }: { active: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex items-center bg-[#1a1910] rounded-xl p-1 gap-1 w-fit">
      {LANGUAGES.map(l => {
        const Icon = l.id === 'curl' ? Terminal : l.id === 'node' ? Code2 : BookOpen;
        return (
          <button key={l.id} onClick={() => onChange(l.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${active === l.id ? 'bg-yellow-500 text-stone-950' : 'text-[#6a6c5d] hover:text-white'}`}>
            <Icon size={12} />{l.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CALLOUT
   ───────────────────────────────────────────────────────── */
function Callout({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' | 'success' }) {
  const colors = { info: 'border-blue-800 bg-blue-950/30 text-blue-300', warning: 'border-yellow-800 bg-yellow-950/30 text-yellow-200', success: 'border-green-800 bg-green-950/30 text-green-300' };
  return <div className={`rounded-xl border p-4 text-xs leading-relaxed ${colors[type]}`}>{children}</div>;
}

/* ─────────────────────────────────────────────────────────
   GUIDE CONTENT
   ───────────────────────────────────────────────────────── */
function GuideContent({ id }: { id: string }) {
  const [lang, setLang] = useState<Lang>('curl');

  if (id === 'quickstart') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Quick Start</h1>
      <p className="text-sm text-[#8a886a] mb-8">Get up and running with FIDScript in 5 minutes.</p>

      <Callout type="info"><p><strong className="text-white">New to FIDScript?</strong> You'll need an account (free signup), an API key, and a WhatsApp instance to start sending.</p></Callout>

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Getting Started</h2>
      {[
        { n: 1, title: 'Create an account', items: ['Sign up at whatsapp.fidscript.com/register', 'Check your email for a magic login code', '500 free welcome tokens are credited automatically'] },
        { n: 2, title: 'Get your API Key', items: ['Go to Settings → API Keys', 'Copy your key — format: fidscript_live_...', 'Keep this secret — regenerate if lost'] },
        { n: 3, title: 'Create a WhatsApp Instance', items: ['Go to WhatsApp Containers → New Instance', 'Name your instance (e.g. my-business)', 'Click Connect → scan the QR code with your WhatsApp app'] },
        { n: 4, title: 'Send your First Message', items: ['Use the API reference or the built-in sandbox', 'Try sending a text message to your own number', 'Check delivery status in real-time on your dashboard'] },
      ].map(({ n, title, items }) => (
        <div key={n} className="flex gap-4 mb-6">
          <div className="w-7 h-7 rounded-full bg-yellow-500 text-stone-950 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">{n}</div>
          <div>
            <div className="text-sm font-semibold text-white mb-2">{title}</div>
            <ul className="space-y-1.5">{items.map(i => <li key={i} className="text-xs text-[#8a886a] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#4a4a3a]">{i}</li>)}</ul>
          </div>
        </div>
      ))}

      <h2 className="text-lg font-bold text-white mt-10 mb-4">Base URL</h2>
      <DocsCodeBlock code={PUBLIC_API_BASE} lang="bash" />
    </motion.div>
  );

  if (id === 'authentication') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Authentication</h1>
      <p className="text-sm text-[#8a886a] mb-8">All requests require your API key in the <code className="bg-[#1a1910] border border-[#262413] px-1.5 py-0.5 rounded text-yellow-500 font-mono text-xs">X-API-Key</code> header.</p>

      <Callout type="warning"><p><strong className="text-white">Keep your API key secret.</strong> If exposed, reset it immediately from Settings → API Keys.</p></Callout>

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Request Example</h2>
      <DocsCodeBlock code={`curl -X GET ${PUBLIC_API_BASE}/usage \\\n  -H "X-API-Key: fidscript_live_your_key_here"`} lang="bash" />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Error Codes</h2>
      <div className="space-y-2">
        {[{ c: 401, m: 'Invalid or missing API key' },{ c: 403, m: 'Valid key but insufficient permissions' },{ c: 429, m: 'Rate limit exceeded — slow down' },{ c: 500, m: 'Server error — retry with backoff' }].map(({ c, m }) => (
          <div key={c} className="flex items-center gap-3 text-xs"><span className="font-mono font-bold text-yellow-500 w-8">{c}</span><span className="text-[#8a886a]">{m}</span></div>
        ))}
      </div>
    </motion.div>
  );

  if (id === 'webhooks') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Webhooks</h1>
      <p className="text-sm text-[#8a886a] mb-8">Configure a webhook URL in your instance settings. FIDScript will POST event payloads to your endpoint as they occur.</p>

      <h2 className="text-lg font-bold text-white mb-4">Supported Events</h2>
      <div className="grid grid-cols-2 gap-2 mb-8">
        {['messages.upsert', 'messages.update', 'connection.update', 'qrcode.updated'].map(e => (
          <div key={e} className="bg-[#1a1910] border border-[#262413] rounded-xl px-3 py-2.5 font-mono text-xs text-[#8a886a]">{e}</div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-white mb-4">Payload — messages.upsert</h2>
      <DocsCodeBlock code={`{
  "event": "messages.upsert",
  "instanceName": "my-instance",
  "data": {
    "key": {
      "id": "BAE5F1234567890",
      "remoteJid": "254712345678@s.whatsapp.net",
      "fromMe": false
    },
    "message": { "conversation": "Hello!" },
    "messageType": "conversation",
    "timestamp": 1718123456
  }
}`} lang="json" />
    </motion.div>
  );

  if (id === 'rate-limits') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Rate Limits</h1>
      <p className="text-sm text-[#8a886a] mb-8">FIDScript uses token-bucket rate limiting per category to ensure platform stability.</p>
      <div className="space-y-2">
        {[
          { cat: 'Send Operations', limit: 'Plan-based', note: 'clientRateLimit — per-client msg/min' },
          { cat: 'Read — V1_READ', limit: '600/min', note: 'Chats, contacts, profile reads' },
          { cat: 'Mutation — V1_MUTATE', limit: '120/min', note: 'Groups, chat updates' },
          { cat: 'Strict — V1_STRICT', limit: '30/min', note: 'Instance restart, profile changes' },
        ].map(({ cat, limit, note }) => (
          <div key={cat} className="flex items-center justify-between bg-[#1a1910] border border-[#262413] rounded-xl px-4 py-3">
            <div><div className="text-sm font-semibold text-white">{cat}</div><div className="text-xs text-[#6a6c5d] mt-0.5">{note}</div></div>
            <div className="text-yellow-500 font-mono text-sm font-bold">{limit}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  if (id === 'sdks') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">SDKs</h1>
      <p className="text-sm text-[#8a886a] mb-8">Official SDKs are coming soon. In the meantime, use the REST API directly — it's simple and works with any HTTP client.</p>
      <Callout type="info"><p>All FIDScript endpoints accept standard JSON. Any programming language can integrate in minutes.</p></Callout>
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Install via npm</h2>
      <DocsCodeBlock code="npm install fidscript-sdk" lang="bash" />
      <h2 className="text-lg font-bold text-white mt-6 mb-4">Install via pip</h2>
      <DocsCodeBlock code="pip install fidscript" lang="bash" />
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-3xl font-bold text-white capitalize">{id.replace(/-/g, ' ')}</h1>
      <p className="text-sm text-[#6a6c5d] mt-4">Documentation for this section coming soon.</p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   API REFERENCE CONTENT (registry-driven)
   ───────────────────────────────────────────────────────── */
function ApiRefContent({ endpoint, lang, setLang }: { endpoint: typeof DOC_GROUPS[0]['endpoints'][0] | null; lang: Lang; setLang: (l: Lang) => void }) {
  if (!endpoint) return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#1a1910] border border-[#262413] flex items-center justify-center mb-4">
        <BookOpen size={24} className="text-[#4a4a3a]" />
      </div>
      <p className="text-sm font-semibold text-white mb-1">Select an endpoint</p>
      <p className="text-xs text-[#6a6c5d] max-w-xs">Choose an endpoint from the sidebar to view its documentation and code examples.</p>
    </div>
  );

  const snippet = buildCodeSnippet(lang, endpoint.method, `/api/v1${endpoint.path}`, endpoint.params, '');

  return (
    <div className="space-y-6">
      {/* Endpoint header */}
      <div className="bg-[#1a1910] border border-[#262413] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${METHOD_COLORS[endpoint.method] || 'bg-gray-600 text-white'}`}>{endpoint.method}</span>
          <code className="text-xs font-mono font-bold text-white">{endpoint.path}</code>
          {endpoint.cost !== undefined && (
            <span className="ml-2 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">{endpoint.cost === 0 ? 'Free' : `${endpoint.cost} token${endpoint.cost > 1 ? 's' : ''}`}</span>
          )}
        </div>
        <p className="text-xs text-[#8a886a]">{endpoint.desc}</p>
      </div>

      {/* Parameters */}
      {endpoint.params.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-[#8a886a] uppercase tracking-widest mb-3">Parameters</h3>
          <ParamTable params={endpoint.params} />
        </div>
      )}

      {/* Authentication */}
      <div>
        <h3 className="text-xs font-bold text-[#8a886a] uppercase tracking-widest mb-3">Authentication</h3>
        <div className="bg-[#0d0c06] border border-[#262413] rounded-xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between mb-1.5"><span className="text-[#8a886a] text-[10px] font-bold">Header</span><CopyButton text={`X-API-Key: fidscript_live_your_key_here`} /></div>
          <p><span className="text-blue-400">X-API-Key</span>: <span className="text-yellow-400">fidscript_live_your_key_here</span></p>
        </div>
      </div>

      {/* Base URL */}
      <div>
        <h3 className="text-xs font-bold text-[#8a886a] uppercase tracking-widest mb-3">Base URL</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-[#13120d] border border-[#262413] px-4 py-3 rounded-xl text-[#c9d1d9]">{PUBLIC_API_BASE}</code>
          <CopyButton text={PUBLIC_API_BASE} />
        </div>
      </div>

      {/* Code examples */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-xs font-bold text-[#8a886a] uppercase tracking-widest">Code Examples</h3>
          <LangTabs active={lang} onChange={setLang} />
        </div>
        <DocsCodeBlock code={snippet} lang={lang === 'curl' ? 'bash' : lang === 'node' ? 'javascript' : lang} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────── */
export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'guides' | 'api-reference'>('guides');
  const [activeSection, setActiveSection] = useState(''); // open group in sidebar
  const [selectedGuide, setSelectedGuide] = useState('quickstart');
  const [selectedEndpoint, setSelectedEndpoint] = useState<typeof DOC_GROUPS[0]['endpoints'][0] | null>(null);
  const [lang, setLang] = useState<Lang>('curl');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">

      {/* ── TOPBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-[#0c0b06] border-b border-[#262413] flex items-center px-4 gap-0">
        <Link to="/" className="flex items-center gap-2 mr-6 shrink-0">
          <img src="/logo.png" alt="FIDScript" className="h-7 w-7 object-contain" />
          <span className="font-bold text-sm text-white tracking-tight">FIDScript</span>
        </Link>

        {/* Top nav tabs */}
        <nav className="hidden md:flex flex-1">
          {[
            { id: 'guides', label: 'Guides' },
            { id: 'api-reference', label: 'API Reference' },
            { id: 'changelog', label: 'Changelog' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as typeof activeTab); if (item.id !== 'api-reference') { setSelectedEndpoint(null); } }}
              className={`h-[52px] px-5 text-sm border-b-2 transition-colors ${activeTab === item.id ? 'text-white border-yellow-500' : 'text-[#8a886a] border-transparent hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2 bg-[#1a1910] border border-[#262413] rounded-lg px-3 py-1.5 w-48 cursor-text">
            <Search size={13} className="text-[#6a6c5d] shrink-0" />
            <span className="text-xs text-[#6a6c5d]">Search docs…</span>
            <span className="ml-auto text-[10px] text-[#4a4a3a] bg-[#262413] rounded px-1.5 py-0.5">⌘K</span>
          </div>
          <Link to="/register" className="text-xs text-[#8a886a] hover:text-white transition-colors">Get API Key</Link>
          <Link to="/contact" className="text-xs text-[#8a886a] hover:text-white transition-colors">Support</Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(true)} className="ml-auto md:hidden p-2 text-[#8a886a]">
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile sidebar */}
      <MobileSidebar
        open={mobileOpen} onClose={() => setMobileOpen(false)}
        activeTab={activeTab} setActiveTab={setActiveTab}
        activeSection={activeSection} setActiveSection={setActiveSection}
        onSelectGuide={setSelectedGuide}
        onSelectEndpoint={(ep) => { setSelectedEndpoint(ep); setActiveTab('api-reference'); }}
      />

      {/* ── SHELL ── */}
      <div className="flex pt-[52px] min-h-screen">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden md:flex w-64 shrink-0 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto border-r border-[#262413] flex-col py-4">

          {activeTab === 'guides' && (
            <div className="px-3">
              <div className="text-[10px] font-bold text-[#4a4a3a] uppercase tracking-widest mb-2 px-2">Guides</div>
              {GUIDES.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGuide(g.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm mb-1 transition-colors ${selectedGuide === g.id ? 'bg-yellow-500/10 text-yellow-500 font-semibold' : 'text-[#8a886a] hover:text-white hover:bg-[#1a1910]'}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'api-reference' && (
            <div className="flex-1 overflow-y-auto">
              {DOC_GROUPS.map(group => (
                <div key={group.name}>
                  <button
                    onClick={() => setActiveSection(activeSection === group.name ? '' : group.name)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b border-[#1a1910] ${activeSection === group.name ? 'text-yellow-500' : 'text-[#6a6c5d]'}`}
                  >
                    <span className={activeSection === group.name ? 'text-yellow-500' : 'text-[#4a4a3a]'}>{SECTION_ICONS[group.name] || <BookOpen size={13} />}</span>
                    {group.name}
                    <span className="ml-auto text-[10px] bg-[#1a1910] text-[#6a6c5d] px-1.5 py-0.5 rounded">{group.endpoints.length}</span>
                  </button>
                  {activeSection === group.name && group.endpoints.map(ep => (
                    <button
                      key={ep.path}
                      onClick={() => setSelectedEndpoint(ep)}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-xs border-b border-[#1a1910]/50 ${selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method ? 'text-white bg-[#1a1910]' : 'text-[#8a886a] hover:text-white'}`}
                    >
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method] || 'bg-gray-600 text-white'}`}>{ep.method}</span>
                      <span className="truncate">{ep.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 px-6 py-10 max-w-3xl pb-24">
          {activeTab === 'guides' && <GuideContent id={selectedGuide} />}
          {activeTab === 'api-reference' && <ApiRefContent endpoint={selectedEndpoint} lang={lang} setLang={setLang} />}
          {activeTab === 'changelog' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-2">Changelog</h1>
              <p className="text-sm text-[#8a6c5d] mb-8">What's new in FIDScript.</p>
              <Callout type="info"><p><strong className="text-white">June 2026</strong> — Initial public launch. WhatsApp API gateway, token billing via M-Pesa, and full REST API reference.</p></Callout>
            </motion.div>
          )}
        </main>

        {/* ── TOC (desktop only, guides) ── */}
        {activeTab === 'guides' && (
          <aside className="hidden xl:block w-48 shrink-0 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto py-10 px-4">
            <div className="text-[10px] font-bold text-[#4a4a3a] uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500/30 flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-yellow-500" /></div>
              On this page
            </div>
            <ul className="space-y-1">
              {GUIDES.map(g => (
                <li key={g.id}>
                  <button
                    onClick={() => setSelectedGuide(g.id)}
                    className={`text-xs w-full text-left py-1 px-2 rounded border-l-2 transition-colors ${selectedGuide === g.id ? 'text-white border-yellow-500 bg-yellow-500/5' : 'text-[#6a6c5d] border-transparent hover:text-white'}`}
                  >
                    {g.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-[#262413]">
              <div className="text-[10px] font-bold text-[#4a4a3a] uppercase tracking-widest mb-3">Need help?</div>
              <Link to="/contact" className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1">
                Contact support <ExternalLink size={11} />
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
