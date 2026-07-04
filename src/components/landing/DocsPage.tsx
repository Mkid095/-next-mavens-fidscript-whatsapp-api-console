import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Copy, Check, Terminal, Code2, BookOpen,
  Search, Menu, X, ExternalLink, ChevronRight,
  Zap, MessageSquare, Users, Bell, Settings, Shield, Globe, Bot
} from 'lucide-react';
import SeoHead from '../shared/SeoHead';
import { CopyButton } from '../shared/CopyButton.js';
import { DocsCodeBlock } from '../shared/DocsCodeBlock.js';
import { ChangelogList } from './ChangelogList.js';
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
  { id: 'cli',            label: 'CLI' },
  { id: 'cli-coverage',   label: 'CLI Coverage' },
  { id: 'tools-integrations', label: 'Tools & Integrations' },
  { id: 'byo-llm',         label: 'Bring Your Own LLM' },
  { id: 'meta-policy',      label: 'WhatsApp Meta Policy' },
  { id: 'chatbot-api',    label: 'Chatbot API' },
  { id: 'llm-api',        label: 'LLM API' },
  { id: 'webhooks',       label: 'Webhooks' },
  { id: 'rate-limits',    label: 'Rate Limits' },
  { id: 'ai-providers',   label: 'AI Providers' },
  { id: 'sdks',           label: 'Direct HTTP (no SDK)' },
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
  'AI Providers':    <Bot size={13} />,
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
  activeTab: 'guides' | 'api-reference' | 'changelog'; setActiveTab: (t: 'guides' | 'api-reference' | 'changelog') => void;
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
                  {(['guides', 'api-reference'] as const).map(tab => (
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

/* Side-by-side cURL ↔ fidscript comparison block */
function CliComparison({ op, curl, cli }: { op: string; curl: string; cli: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-white">{op}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-mono text-[#6a6c5d] uppercase tracking-wider mb-1.5">cURL</div>
          <DocsCodeBlock code={curl} lang="bash" />
        </div>
        <div>
          <div className="text-[10px] font-mono text-yellow-500 uppercase tracking-wider mb-1.5">fidscript CLI</div>
          <DocsCodeBlock code={cli} lang="bash" />
        </div>
      </div>
    </div>
  );
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

  if (id === 'cli') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Use the CLI</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        Every <code className="font-mono text-[#eab308]">/api/v1</code> endpoint is wrapped by
        a single binary called <code className="font-mono text-[#eab308]">fidscript</code>.
        It&rsquo;s built for both humans and AI agents — every command supports
        <code className="font-mono text-[#eab308]">--json</code> and
        <code className="font-mono text-[#eab308]">--yaml</code> output, and
        <code className="font-mono text-[#eab308]">--verbose</code> prints the underlying
        curl request as it&rsquo;s sent.
      </p>

      <h2 className="text-lg font-bold text-white mb-4">Install</h2>
      <DocsCodeBlock
        code="curl -Ls https://whatsapp.fidscript.com/cli/install.sh | sh"
        lang="bash"
      />
      <p className="text-xs text-[#6a6c5d] mt-3">
        Requires Node.js 18+. The installer will bootstrap it for you.
      </p>

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Side-by-side: cURL vs CLI</h2>
      <div className="space-y-6">
        <CliComparison
          op="Send a text message"
          curl={`curl -X POST ${PUBLIC_API_BASE}/messages/text/my-bot \\\n  -H "X-API-Key: $FIDSCRIPT_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"number":"+254700000000","text":"Hello!"}'`}
          cli={`fidscript send text my-bot \\\n  --to +254700000000 \\\n  --text "Hello!"`}
        />
        <CliComparison
          op="Check token balance"
          curl={`curl ${PUBLIC_API_BASE}/usage \\\n  -H "X-API-Key: $FIDSCRIPT_API_KEY"`}
          cli={`fidscript tokens`}
        />
        <CliComparison
          op="List WhatsApp instances (from DB)"
          curl={`curl ${PUBLIC_API_BASE}/instance/connection-state/my-bot \\\n  -H "X-API-Key: $FIDSCRIPT_API_KEY"`}
          cli={`fidscript instance list          # JWT auth — DB-backed list\nfidscript instance watch my-bot    # SSE live state`}
        />
        <CliComparison
          op="Create + publish a chatbot"
          curl={`curl -X POST ${PUBLIC_API_BASE}/chatbots \\\n  -H "X-API-Key: $FIDSCRIPT_API_KEY" \\\n  -d '{"name":"my-bot","prompt":"..."}'`}
          cli={`fidscript chatbot setup --instance my-bot   # interactive wizard\nfidscript chatbot publish <id> --watch          # stream live progress`}
        />
      </div>

      <h2 className="text-lg font-bold text-white mt-10 mb-4">Auth for /api/instance, /api/platform, /api/sse</h2>
      <p className="text-sm text-[#a8a594] mb-4">
        Those routes use a Bearer JWT, not an API key. Run
        <code className="font-mono text-[#eab308] mx-1">fidscript login</code>
        once and your JWT is stored in <code className="font-mono text-[#eab308]">~/.fidscript/credentials</code>.
        After login, the data-backed instance list and the chatbot CRUD commands just work.
      </p>
      <DocsCodeBlock
        code={`# sign in (passwordless — 6-digit code via email)
fidscript login --email you@example.com

# verify
fidscript whoami

# now unlocked: DB-backed lists, SSE, chatbot CRUD
fidscript instance list
fidscript instance watch my-bot
fidscript chatbot list
fidscript chatbot setup --instance my-bot`}
        lang="bash"
      />
    </motion.div>
  );

  if (id === 'tools-integrations') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Tools &amp; Integrations</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        FIDScript is an <strong className="text-[#cbd3cf]">AI orchestration layer</strong> that sits on
        top of your business systems. The chatbot never stores your customer data — it calls{' '}
        <strong className="text-[#cbd3cf]">tools</strong> that hit your external APIs, databases, or
        e-commerce platforms in real time. This means the bot always answers with live, accurate data.
      </p>

      <Callout type="info">
        <p>
          <strong className="text-white">Data-first principle:</strong> When a tool exists that could
          answer the user's question, the bot MUST use the tool before relying on its own knowledge.
          Never guess inventory, pricing, customer details, or order status — always call the tool first.
        </p>
      </Callout>

      <h2 className="text-lg font-bold text-white mt-8 mb-4">The 6-layer architecture</h2>
      <DocsCodeBlock
        code={`External Systems (Shopify, Postgres, REST API, ERP, CRM)
       ↓
1. integration_connections  — encrypted credentials to external systems
       ↓
2. data_sources             — datasets exposed by a connection
       ↓
3. tools                    — individual LLM-callable operations:
                               lookup (single-record fetch)
                               search (free-text filter)
                               query  (HTTP GET)
                               action (HTTP POST/PUT/DELETE)
                               workflow (multi-step chain)
       ↓
4. chatbot_tools            — attach tools to chatbots + per-tool limits
       ↓
5. tool_execution_logs      — every call logged for audit
       ↓
LLM → WhatsApp reply`}
        lang="text"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Step 1: Create a data source</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        A data source is the link between your external system and FIDScript. It can be a static JSON
        dataset (for demos), an API endpoint, or a SQL query.
      </p>
      <DocsCodeBlock
        code={`# Demo data source (e-commerce sample — works immediately)
fidscript data-source create my-catalog --type demo --description "Sample products + customers"

# Real API data source (your production system)
fidscript data-source create shopify-prod \\
  --type api_endpoint \\
  --description "Shopify product catalog" \\
  --config '{"endpoint":"https://my-store.myshopify.com/api/products.json"}'

# Or via the API:
curl -X POST https://whatsapp.fidscript.com/api/platform/data-sources \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"my-catalog","type":"demo","config_json":"{}"}'`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Step 2: Add tools to the data source</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Tools are the operations the LLM can call. Each tool has a name, description, parameter schema,
        and a type that determines how it executes.
      </p>
      <DocsCodeBlock
        code={`# Each workspace auto-seeds 4 demo tools. See them:
fidscript tool list

# Execute a tool directly (test before attaching to a bot):
fidscript tool exec <data-source-id> <tool-id> \\
  --args '{"query":"spoon"}'

# Example: search the demo catalog for "spoon"
# Returns: [{ sku: "SPO-001", name: "Stainless steel spoon", price_kes: 250, in_stock: 120 }]`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Step 3: Attach tools to a chatbot</h2>
      <DocsCodeBlock
        code={`# See a chatbot's current tools
fidscript chatbot tools <chatbot-id>

# Attach a tool (the LLM will now be able to call it)
fidscript chatbot tools <chatbot-id> attach <tool-id>

# Detach
fidscript chatbot tools <chatbot-id> detach <tool-id>`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Step 4: How the tool-calling engine works</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        When the chatbot receives a message, the inference loop:
      </p>
      <DocsCodeBlock
        code={`1. Build system prompt listing all attached tools + their parameters
2. Call the LLM with the user's message
3. Parse the LLM reply for tool calls:
   <tool_call name="search_products">{"query":"spoon"}</tool_call>
4. Execute each tool → calls the external API or reads demo data
5. Append the result back into the conversation context
6. Re-call the LLM with the enriched context
7. Loop until the LLM produces a final answer (no more tool calls)
   Max 5 iterations.`}
        lang="text"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">E-commerce demo walkthrough</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Every workspace is auto-seeded with a demo catalog. Here's what happens when a user texts your WhatsApp:
      </p>
      <DocsCodeBlock
        code={`User:  "Do you have spoons?"
  → LLM calls search_products({"query":"spoon"})
  → Tool returns: [{name:"Stainless steel spoon", price_kes:250, in_stock:120}]
  → LLM uses the result to answer

Bot:  "Yes! We have stainless steel spoons at KES 250 each.
       We currently have 120 in stock. Would you like to order some?"

User:  "Yes, order 5"
  → LLM calls add_to_cart({"phone":"+254700000001","sku":"SPO-001","qty":5})
  → Then calls place_order({"phone":"+254700000001"})
  → Returns: {order_id:"ORD-DEMO", total_kes:1750, payment_url:"..."}

Bot:  "Order placed! 5 spoons for KES 1,750.
       Pay here: https://pay.example.com/ORD-DEMO"

User:  "Who am I?"
  → LLM calls lookup_customer_by_phone({"phone":"+254700000001"})
  → Returns: {name:"Ken Wanjiku", tier:"gold"}

Bot:  "Hello Ken! You're a Gold tier customer."`}
        lang="text"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Connecting a real system</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Replace the demo data source with your production API:
      </p>
      <DocsCodeBlock
        code={`# 1. Create a real data source pointing at your API
fidscript data-source create shopify-api \\
  --type api_endpoint \\
  --config '{"endpoint":"https://my-store.myshopify.com/api/2024-01/products.json"}'

# 2. Create a tool that queries it
fidscript api POST /api/platform/data-sources/<ds-id>/tools \\
  --auth jwt \\
  -d '{
    "name": "search_shopify_products",
    "description": "Search the Shopify product catalog",
    "type": "query",
    "parameters_json": "{\"type\":\"object\",\"properties\":{\"query\":{\"type\":\"string\"}}}",
    "executor_json": "{\"endpoint\":\"https://my-store.myshopify.com/api/2024-01/products.json\"}"
  }'

# 3. Attach it to your chatbot
fidscript chatbot tools <chatbot-id> attach <tool-id>

# The chatbot now answers with REAL data from your Shopify store.`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Tool types reference</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1910]">
            <tr>{['Type', 'What it does', 'When to use'].map(h => <th key={h} className="text-left px-4 py-2 font-bold text-[#8a886a]">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#262413]">
            <tr><td className="px-4 py-2 font-mono text-yellow-500">lookup</td><td className="px-4 py-2 text-[#a8a594]">Single-record fetch by key (phone, ID, SKU)</td><td className="px-4 py-2 text-[#a8a594]">Customer identification, order lookup</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">search</td><td className="px-4 py-2 text-[#a8a594]">Free-text + filtered search returning multiple records</td><td className="px-4 py-2 text-[#a8a594]">Product search, inventory check</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">query</td><td className="px-4 py-2 text-[#a8a594]">HTTP GET to a remote API</td><td className="px-4 py-2 text-[#a8a594]">Read from Shopify, WooCommerce, custom REST</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">action</td><td className="px-4 py-2 text-[#a8a594]">HTTP POST/PUT/DELETE (mutating)</td><td className="px-4 py-2 text-[#a8a594]">Create order, add to cart, push STK payment</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">workflow</td><td className="px-4 py-2 text-[#a8a594]">Multi-step chain calling other tools in sequence</td><td className="px-4 py-2 text-[#a8a594]">Full checkout: search → cart → order → pay → confirm</td></tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Agent-driven setup</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        The entire tool platform is CLI-accessible. An AI agent (Claude Code, Cursor, etc.) can set up
        a full chatbot with tools from scratch:
      </p>
      <DocsCodeBlock
        code={`# Agent prompt: "Use fidscript to set up a WhatsApp chatbot
# connected to my Shopify store."

# The agent runs:
fidscript login --email owner@store.com --code 123456
fidscript instance create store-bot
fidscript instance qr store-bot          # → QR for the user to scan
fidscript data-source create shopify \\
  --type api_endpoint \\
  --config '{"endpoint":"https://mystore.myshopify.com/api/products.json"}'
fidscript chatbot create store-assistant --instance store-bot \\
  --prompt "You are a helpful store assistant. Always check inventory before answering."
fidscript chatbot tools <bot-id> attach <tool-id>
fidscript chatbot publish <bot-id>

# Done — the bot is live and answering with real product data.`}
        lang="bash"
      />
    </motion.div>
  );

  if (id === 'byo-llm') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Bring Your Own LLM</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        Wire any LLM provider into your chatbot — OpenAI, Anthropic, Google Gemini, OpenRouter,
        Azure, or your own self-hosted endpoint. Your API key is encrypted at rest and never
        leaves the FIDScript backend.
      </p>

      <h2 className="text-lg font-bold text-white mb-4">1. See what's available</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        List the providers your admin has registered (custom providers, free-tier OpenRouter, etc.):
      </p>
      <DocsCodeBlock
        code={`curl -X GET ${PUBLIC_API_BASE.replace('/api/v1','')}/api/platform/llm-connections/available-providers \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"
# or
fidscript --json llm providers`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">2. Create a connection (with your API key)</h2>
      <CliComparison
        op="Create a connection (BYO API key)"
        curl={`curl -X POST ${PUBLIC_API_BASE.replace('/api/v1','')}/api/platform/llm-connections \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "api_key": "sk-...",
    "is_default": true
  }'`}
        cli={`fidscript llm create openai-prod \\
  --provider openai \\
  --model gpt-4o-mini \\
  --api-key "$OPENAI_API_KEY" \\
  --default`}
      />

      <p className="text-xs text-[#6a6c5d] mt-3">
        The CLI also accepts <code className="font-mono text-[#eab308]">--api-key @key.txt</code> for files.
        The key is encrypted with AES-GCM before being stored; only the last 4 characters are
        ever shown back to you.
      </p>

      <h3 className="text-sm font-bold text-[#cbd3cf] mt-6 mb-3">Self-hosted / Ollama / custom endpoint</h3>
      <DocsCodeBlock
        code={`fidscript llm create ollama-llama3 \\
  --provider custom \\
  --model llama3.1 \\
  --endpoint http://localhost:11434 \\
  --default

# Or a hosted proxy (vLLM, LM Studio, OpenRouter free, etc.):
fidscript llm create openrouter-free \\
  --provider openai \\
  --model "meta-llama/llama-3.1-8b-instruct:free" \\
  --endpoint https://openrouter.ai/api/v1 \\
  --api-key "$OPENROUTER_API_KEY"`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">3. Verify it works</h2>
      <DocsCodeBlock
        code={`fidscript --json llm test llmc_abc123
# → { "success": true, "message": "Connection verified successfully" }

# Or get the full record (key masked):
fidscript llm get llmc_abc123`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">4. Attach the connection to a chatbot</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        When creating a chatbot, set <code className="font-mono text-[#eab308]">llm_connection</code> in the
        setup config. You can also swap it on an existing chatbot at any time.
      </p>
      <DocsCodeBlock
        code={`# Headless create with a fully customized chatbot
fidscript chatbot setup --config '{
  "name": "support-bot",
  "instance": "my-bot",
  "system_prompt": "You are a polite, concise support agent. Never promise refunds without a manager.",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "llm_connection": "llmc_abc123",
  "hallucination_policy": "strict",
  "max_tokens": 400,
  "temperature": 0.3,
  "max_history_messages": 20,
  "trigger": { "type": "keyword", "value": "help" },
  "policies": {
    "confidence_threshold": 0.7,
    "fallback_reply": "Let me connect you with a human colleague."
  },
  "handoff": "auto",
  "publish": true
}'

# Or update an existing chatbot in place
fidscript chatbot ai-config bot_xyz789 \\
  --llm-connection llmc_abc123 \\
  --model gpt-4o-mini \\
  --system-prompt "..." \\
  --hallucination-policy strict`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">5. Tune generation</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Every AI config field is exposed via the CLI. Combine them to shape the bot's behavior.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1910]">
            <tr>{['Field', 'Type', 'Effect'].map(h => <th key={h} className="text-left px-4 py-2 font-bold text-[#8a886a]">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#262413]">
            <tr><td className="px-4 py-2 font-mono text-yellow-500">system_prompt</td><td className="px-4 py-2 font-mono text-[#8a886a]">string</td><td className="px-4 py-2 text-[#a8a594]">Your custom instructions: tone, persona, hard rules.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">model</td><td className="px-4 py-2 font-mono text-[#8a886a]">string</td><td className="px-4 py-2 text-[#a8a594]">Model name passed to the provider.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">temperature</td><td className="px-4 py-2 font-mono text-[#8a886a]">0–2</td><td className="px-4 py-2 text-[#a8a594]">Lower = more deterministic, higher = more creative.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">top_p</td><td className="px-4 py-2 font-mono text-[#8a886a]">0–1</td><td className="px-4 py-2 text-[#a8a594]">Nucleus sampling. 1.0 = no filter.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">max_tokens</td><td className="px-4 py-2 font-mono text-[#8a886a]">int</td><td className="px-4 py-2 text-[#a8a594]">Hard cap on response length.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">max_history_messages</td><td className="px-4 py-2 font-mono text-[#8a886a]">int</td><td className="px-4 py-2 text-[#a8a594]">Past N messages included in context.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">hallucination_policy</td><td className="px-4 py-2 font-mono text-[#8a886a]">enum</td><td className="px-4 py-2 text-[#a8a594]">strict refuses on low confidence; balanced (default); creative allows; disabled passes through.</td></tr>
            <tr><td className="px-4 py-2 font-mono text-yellow-500">llm_connection_id</td><td className="px-4 py-2 font-mono text-[#8a886a]">id</td><td className="px-4 py-2 text-[#a8a594]">Wires a workspace LLM connection (BYO key).</td></tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-bold text-white mt-8 mb-4">6. Failover chains</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Register multiple connections, set priorities, and FIDScript will fall over if your
        primary provider hits a rate limit or goes down.
      </p>
      <DocsCodeBlock
        code={`# Set up primary + backup
fidscript llm create openai-prod --provider openai --model gpt-4o-mini --api-key $OPENAI_KEY --priority 100
fidscript llm create openrouter-fallback --provider openai --model "openai/gpt-4o-mini" --api-key $OR_KEY --priority 50
fidscript llm create ollama-last --provider custom --model llama3.1 --endpoint http://localhost:11434 --priority 10

# Higher priority is tried first; the next one takes over on failure.`}
        lang="bash"
      />
    </motion.div>
  );

  if (id === 'meta-policy') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Chatbot API</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        Full reference for the <code className="font-mono text-[#eab308]">/api/platform/chatbots</code>
        endpoints. All require a Bearer JWT (run <code className="font-mono text-[#eab308]">fidscript login</code>{' '}
        once to store one). Each request costs <code className="font-mono text-[#eab308]">1 token</code>{' '}
        for AI processing; reads and configs are free.
      </p>

      <Callout type="info">
        <p>
          Looking for an end-to-end walkthrough? See the{' '}
          <a href="#byo-llm" className="text-yellow-500 underline">Bring Your Own LLM</a> guide.
          The sections below are a dry reference for each endpoint + request body.
        </p>
      </Callout>

      <h2 className="text-lg font-bold text-white mt-6 mb-4">Chatbot CRUD</h2>
      <DocsCodeBlock
        lang="bash"
        code={`# List chatbots in your workspace
curl https://whatsapp.fidscript.com/api/platform/chatbots \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Get one chatbot (full config: aiConfig, triggers, rules, policies, handoffRules, groupSettings)
curl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Create
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "instance_id": "inst_abc123",
    "name": "support-bot",
    "description": "24/7 customer support",
    "priority": 0,
    "enabled": true
  }'

# Update (any subset of name/description/priority/enabled/instance_id)
curl -X PUT https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"priority": 5}'

# Delete
curl -X DELETE https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Toggle enabled/disabled
curl -X PATCH https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/toggle \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"enabled": false}'`} />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">AI behavior</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        The full AI config endpoint — model, provider, system prompt, hallucination policy,
        generation params, history window, and BYO LLM connection.
      </p>
      <DocsCodeBlock
        lang="bash"
        code={`# Update AI behavior (PUT — partial updates supported)
curl -X PUT https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/ai-config \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "system_prompt": "You are a polite, concise support agent.",
    "hallucination_policy": "strict",
    "max_tokens": 400,
    "temperature": 0.3,
    "top_p": 1.0,
    "max_history_messages": 20,
    "llm_connection_id": "llmc_abc"
  }'`} />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Triggers, response rules, handoff</h2>
      <DocsCodeBlock
        lang="bash"
        code={`# Add a trigger (keyword / regex / mention / always)
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/triggers \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "trigger_type": "keyword",
    "trigger_value": "help",
    "keyword_mode": "contains",
    "require_previous_bot_reply": 0,
    "enabled": true,
    "priority": 0
  }'

# Delete a trigger
curl -X DELETE https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/triggers/trig_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Add a response rule (conditions_json and an action)
curl -X POST https://whatscript.com/api/platform/chatbots/bot_xyz/rules \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "name": "Refund handoff",
    "conditions_json": "[{\"type\":\"intent\",\"op\":\"matches\",\"value\":\"refund\"}]",
    "action": "ai",
    "action_config_json": "{\"reply\":\"Let me connect you with a manager.\"}",
    "priority": 10,
    "enabled": true
  }'

# Add a handoff rule (route to a human team under conditions)
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/handoff-rules \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "name": "Low confidence → human",
    "conditions_json": "[{\"type\":\"confidence\",\"op\":\"lt\",\"value\":0.6}]",
    "target_team_id": "team_support",
    "target_team_name": "Support",
    "priority": 0,
    "enabled": true
  }'`} />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Group settings, contact assignments, test</h2>
      <DocsCodeBlock
        lang="bash"
        code={`# Group-specific behavior (per JID)
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/group-settings \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "group_jid": "120363@g.us",
    "respond_when_mentioned": true,
    "respond_to_all": false,
    "silence_on_bot_reply": true
  }'

# Assign a contact to the bot
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/contacts/contact_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Unassign
curl -X DELETE https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/contacts/contact_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Test a trigger against a message
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/test-trigger \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "message": "I need help with my order",
    "contact_id": "contact_abc",
    "conversation_id": "conv_xyz"
  }'`} />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Publishing, versions, health, traces</h2>
      <DocsCodeBlock
        lang="bash"
        code={`# Publish a chatbot (runs the validation + build pipeline)
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/publish \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"draft_json": "{...}"}'
# → { "success": true, "data": { "jobId": "job_abc" } }

# Watch progress via SSE
curl -N "https://whatsapp.fidscript.com/api/sse/publish-jobs/job_abc?token=$FIDSCRIPT_JWT"

# Most recent publish job
curl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/publish-job \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Health (provider, model, knowledge count, triggers, last test)
curl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/health \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Validate a draft before publishing (catches issues early)
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/test-config \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"draft_json": "{...}"}'

# List version snapshots (for rollback)
curl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/versions \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Roll back to a specific version
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/rollback \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"version_id": "ver_xyz"}'

# Duplicate (clone) a chatbot
curl -X POST https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/duplicate \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Token forecast (next 30 days at current pace)
curl https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/token-forecast \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Recent runtime traces (token usage, prompts/responses)
curl "https://whatsapp.fidscript.com/api/platform/chatbots/bot_xyz/traces?limit=50" \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"`} />
    </motion.div>
  );

  if (id === 'llm-api') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">LLM Connection API</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        Reference for the <code className="font-mono text-[#eab308]">/api/platform/llm-connections</code>
        endpoints. Use these to register BYO API keys (encrypted at rest), manage failover
        priorities, and test connections. All require a Bearer JWT.
      </p>

      <h2 className="text-lg font-bold text-white mt-6 mb-4">Discovery</h2>
      <DocsCodeBlock
        lang="bash"
        code={`# List workspace-scoped connections (with masked key suffix)
curl https://whatsapp.fidscript.com/api/platform/llm-connections \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Providers available in your workspace registry
curl https://whatsapp.fidscript.com/api/platform/llm-connections/available-providers \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"`} />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Create / update / delete</h2>
      <DocsCodeBlock
        lang="bash"
        code={`# Create (API key encrypted with AES-GCM before storage; only last4 is ever returned)
curl -X POST https://whatsapp.fidscript.com/api/platform/llm-connections \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "api_key": "sk-...",
    "is_default": true,
    "monthly_limit": 0,
    "priority": 100
  }'

# Self-hosted / Ollama / LM Studio / OpenRouter free
curl -X POST https://whatsapp.fidscript.com/api/platform/llm-connections \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "provider": "custom",
    "model": "llama3.1",
    "endpoint": "http://localhost:11434",
    "priority": 10
  }'

# Update any subset (model, endpoint, api_key, is_default, monthly_limit, priority, enabled)
curl -X PUT https://whatsapp.fidscript.com/api/platform/llm-connections/llmc_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "is_default": true,
    "monthly_limit": 5000000
  }'

# Rotate the API key (replaces existing)
curl -X PUT https://whatsapp.fidscript.com/api/platform/llm-connections/llmc_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT" -H "Content-Type: application/json" \\
  -d '{"api_key": "sk-NEW..."}'

# Delete
curl -X DELETE https://whatsapp.fidscript.com/api/platform/llm-connections/llmc_abc \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Test (verifies the key by sending a "Hi" prompt)
curl -X POST https://whatsapp.fidscript.com/api/platform/llm-connections/llmc_abc/test \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"`} />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Response shapes</h2>
      <p className="text-xs text-[#8a886a] mb-3">A connection row looks like:</p>
      <DocsCodeBlock
        lang="json"
        code={`{
  "success": true,
  "data": [
    {
      "id": "llmc_1740000000_xyz",
      "workspace_id": "cli_abcdef",
      "provider": "openai",
      "provider_name": "OpenAI",
      "provider_type": "openai",
      "provider_registry_id": "reg_openai",
      "model": "gpt-4o-mini",
      "endpoint": "",
      "is_default": 1,
      "enabled": 1,
      "api_key_last4": "AbCd",
      "monthly_limit": 0,
      "priority": 100,
      "created_at": "2026-07-03T12:34:56.000Z"
    }
  ]
}`} />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Failover chain</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Set <code className="font-mono text-[#eab308]">priority</code> on each connection.
        Higher is preferred; if it fails the next-highest takes over. The chatbot's
        <code className="font-mono text-[#eab308]">llm_connection_id</code> can also be
        updated via <code className="font-mono text-[#eab308]">PUT /api/platform/chatbots/:id/ai-config</code>{' '}
        at any time to swap providers without redeploying.
      </p>
    </motion.div>
  );

  if (id === 'meta-policy') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">WhatsApp Meta Policy Compliance</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        WhatsApp enforces two hard ceilings on every business account that uses the
        Business API. FIDScript paces your traffic through multiple layers so you stay
        well under both, but you should design your chatbot accordingly.
      </p>

      <h2 className="text-lg font-bold text-white mb-4">1. The two ceilings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        <div className="bg-[#1a1910] border border-[#262413] rounded-2xl p-4">
          <p className="text-yellow-500 font-bold text-sm">Speed ceiling</p>
          <p className="text-3xl font-black text-white mt-2">~80 MPS</p>
          <p className="text-xs text-[#6a6c5d] mt-2">Max messages-per-second per phone number. Bulk senders are paced adaptively.</p>
        </div>
        <div className="bg-[#1a1910] border border-[#262413] rounded-2xl p-4">
          <p className="text-yellow-500 font-bold text-sm">Volume ceiling</p>
          <p className="text-3xl font-black text-white mt-2">250 / day → ∞</p>
          <p className="text-xs text-[#6a6c5d] mt-2">Unique customers initiated in a rolling 24h, tiered by quality rating.</p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-white mb-4">2. Quality rating tiers</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Your tier is set by Meta based on the quality of conversations you have — recipient
        blocks, reports, and low engagement all drag it down. Higher tiers unlock higher volume.
      </p>
      <div className="space-y-2 mb-8">
        {[
          { tier: 'Tier 0', limit: '250', note: 'New accounts and accounts with quality issues' },
          { tier: 'Tier 1', limit: '1,000', note: 'After sustained positive quality' },
          { tier: 'Tier 2', limit: '10,000', note: 'Strong quality over rolling 7 days' },
          { tier: 'Tier 3', limit: '100,000', note: 'Consistent high quality at scale' },
          { tier: 'Tier 4', limit: 'Unlimited', note: 'Reserved for very large senders' },
        ].map(({ tier, limit, note }) => (
          <div key={tier} className="flex items-center justify-between bg-[#1a1910] border border-[#262413] rounded-xl px-4 py-3">
            <div><div className="text-sm font-semibold text-white">{tier}</div><div className="text-xs text-[#6a6c5d] mt-0.5">{note}</div></div>
            <div className="text-yellow-500 font-mono text-sm font-bold">{limit}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-white mb-4">3. Prohibited content categories</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        WhatsApp explicitly bans the following. Your chatbot's <code className="font-mono text-[#eab308]">system_prompt</code> should refuse
        or hand off on any of these — never try to comply:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
        {[
          'Adult / sexual content',
          'Hate speech or threats',
          'Weapons, explosives, ammunition',
          'Drugs (recreational, prescription without verification)',
          'Tobacco, vape, alcohol sales',
          'Gambling, lotteries (without prior approval)',
          'Medical, financial, legal advice (must disclaim)',
          'Multi-level marketing / pyramid schemes',
          'Crypto / forex / "get rich quick" schemes',
          'Surveillance products',
          'Adult dating services',
          'Misleading health claims',
        ].map((cat) => (
          <div key={cat} className="flex items-center gap-2 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2 text-xs text-red-200">
            <span className="text-red-400">✗</span>{cat}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-white mb-4">4. How FIDScript enforces compliance</h2>
      <ul className="list-disc list-inside text-sm text-[#a8a594] space-y-2 mb-8">
        <li>
          <strong className="text-white">Tier-aware volume cap</strong> — daily unique-customer
          initiations are tracked against your tier. Sends past the cap are queued for the
          next 24h window, never dropped.
        </li>
        <li>
          <strong className="text-white">Adaptive bulk pacing</strong> — 10 MPS at idle, ramps to
          30 MPS when the queue hits 5,000+ (still well under Meta's 80 MPS cap).
        </li>
        <li>
          <strong className="text-white">Per-instance rate limiter</strong> — 3 reads/sec/instance
          and 2 mutations/sec/instance to prevent account-level blocks.
        </li>
        <li>
          <strong className="text-white">Hallucination policy</strong> — set per-chatbot. <code className="font-mono text-[#eab308]">strict</code> refuses
          on low confidence; <code className="font-mono text-[#eab308]">balanced</code> gives a hedged answer; <code className="font-mono text-[#eab308]">creative</code> lets the model
          improvise; <code className="font-mono text-[#eab308]">disabled</code> passes through unchanged.
        </li>
        <li>
          <strong className="text-white">Confidence threshold + handoff</strong> — below your
          configured threshold (e.g. 0.6), the bot hands the conversation to a human
          instead of risking a wrong answer that triggers a user block.
        </li>
        <li>
          <strong className="text-white">24h session window</strong> — utility templates can only be
          sent within 24h of the user's last message. Marketing templates require explicit
          opt-in via template approval.
        </li>
      </ul>

      <h2 className="text-lg font-bold text-white mb-4">5. Best practices for your system_prompt</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Configure <code className="font-mono text-[#eab308]">system_prompt</code> defensively. Recommended clauses to include:
      </p>
      <DocsCodeBlock
        code={`You are an assistant for ACME, a Kenyan e-commerce store.

Tone: warm, concise, never pushy. Reply in the user's language when you can detect it.

Hard rules:
- Never promise a refund, return, or legal outcome. If the user asks for one,
  respond: "I'll connect you with a manager who can help" and trigger a handoff.
- Never give medical, legal, or financial advice. Respond: "I'm not qualified
  to advise on that — please consult a professional."
- Never discuss politics, religion, or competitor products.
- Never claim to be a real person. You can say you're an AI assistant for ACME.
- If you're not sure, say so. It's better to admit uncertainty than to guess
  and risk the user being misled.

Operational:
- If you're confident in your answer, reply directly. If you have ANY doubt,
  ask a clarifying question or hand off.
- Keep replies under 80 words. Use line breaks for lists.
- If a user asks something outside your scope, hand off with a friendly note.`}
        lang="text"
      />

      <h2 className="text-lg font-bold text-white mb-4">6. When to hand off to a human</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Configure handoff conditions per chatbot. Examples of conditions that should always escalate:
      </p>
      <ul className="list-disc list-inside text-sm text-[#a8a594] space-y-1 mb-8">
        <li>User asks for a human / manager / supervisor</li>
        <li>User expresses frustration (sentiment below threshold)</li>
        <li>User requests a refund, return, cancellation, or account closure</li>
        <li>User reports a bug, abuse, or safety issue</li>
        <li>User asks about anything in the prohibited content list above</li>
        <li>Conversation has been going in circles (3+ ambiguous turns)</li>
        <li>Bot's own confidence score is below the configured threshold</li>
      </ul>

      <h2 className="text-lg font-bold text-white mb-4">7. Monitoring your quality rating</h2>
      <DocsCodeBlock
        code={`# Check current tier + volume
curl ${PUBLIC_API_BASE.replace('/api/v1','')}/api/auth/client/me \\
  -H "Authorization: Bearer $FIDSCRIPT_JWT"

# Token forecast for next 30 days
fidscript --json chatbot token-forecast <chatbot-id>`}
        lang="bash"
      />
      <p className="text-xs text-[#6a6c5d] mt-3">
        If your quality rating drops, lower your tier limit, tighten the bot's
        handoff conditions, and review recent conversations for blocks or reports.
      </p>
    </motion.div>
  );

  if (id === 'rate-limits') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Rate Limits</h1>
      <p className="text-sm text-[#8a886a] mb-8">Every request is paced through multiple layers so production traffic stays well under WhatsApp&rsquo;s account thresholds.</p>
      <div className="space-y-2">
        {[
          { cat: 'Chat reads (portal)', limit: '10/sec/client', note: 'Chat list, threads, profile-pic via /api/platform/*' },
          { cat: 'WhatsApp reads', limit: '3/sec/instance', note: 'Per-instance pacer; protects your account from blocks' },
          { cat: 'Mutations', limit: '2/sec/instance', note: 'markRead, group edits, settings, presence' },
          { cat: 'Bulk send', limit: '10 MPS (30 MPS @ queue ≥ 5,000)', note: 'Dynamic per-campaign pacing; well under WhatsApp 80 MPS ceiling' },
          { cat: 'Volume (Tier 0)', limit: '250 unique/day', note: 'Tier 1: 1k · Tier 2: 10k · Tier 3: 100k · Tier 4: unlimited' },
          { cat: 'Phonebook sync', limit: '5/min', note: 'Manual trigger; use sparingly — full phonebook size' },
        ].map(({ cat, limit, note }) => (
          <div key={cat} className="flex items-center justify-between bg-[#1a1910] border border-[#262413] rounded-xl px-4 py-3">
            <div><div className="text-sm font-semibold text-white">{cat}</div><div className="text-xs text-[#6a6c5d] mt-0.5">{note}</div></div>
            <div className="text-yellow-500 font-mono text-sm font-bold">{limit}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-[#262413] bg-[#1a1910] p-4">
        <p className="text-sm font-semibold text-white">Why these limits?</p>
        <p className="mt-2 text-xs leading-relaxed text-[#a8a594]">
          WhatsApp enforces two ceilings on business accounts: a <em>speed</em> ceiling (~80 MPS
          sends) and a <em>volume</em> ceiling (unique customers initiated per rolling 24h,
          tiered: 250 → 1k → 10k → 100k → unlimited). We pace every request through both
          a portal API limiter (10/sec) and a per-instance WhatsApp call limiter
          (3 reads/sec / 2 mutations/sec) so production traffic stays well under both.
          Bulk campaigns adapt their throughput to queue depth, and the composer surfaces
          your daily usage with an upgrade-ready indicator at the 50% threshold.
        </p>
      </div>
    </motion.div>
  );


  if (id === 'ai-providers') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">AI Providers</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        Connect any LLM provider to power your chatbot's AI responses. FIDScript supports OpenAI, OpenRouter, Anthropic, Google Gemini, Azure OpenAI, Ollama, and any OpenAI-compatible custom endpoint.
      </p>

      <Callout type="info"><p><strong className="text-white">Bring Your Own Model (BYOM).</strong> You provide the API key — FIDScript encrypts it with AES-256-GCM and never stores plaintext keys. Works at the workspace level so your team shares connections safely.</p></Callout>

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Supported Providers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {[
          { name: 'OpenRouter', desc: 'OpenAI-compatible gateway with 100+ free & paid models. Best for variety.', badge: 'Free tier', badgeColor: 'emerald' },
          { name: 'OpenAI', desc: 'Direct to GPT-4o, GPT-4o Mini, o1 models via OpenAI API.', badge: 'Paid', badgeColor: 'stone' },
          { name: 'Anthropic Claude', desc: "Claude 3.5 Sonnet, Haiku via Anthropic's /messages endpoint.", badge: 'Paid', badgeColor: 'stone' },
          { name: 'Google Gemini', desc: 'Gemini 2.0 Flash, 1.5 Pro via Google AI API.', badge: 'Paid', badgeColor: 'stone' },
          { name: 'Azure OpenAI', desc: 'Enterprise-hosted GPT models via Azure AD auth.', badge: 'Enterprise', badgeColor: 'stone' },
          { name: 'Ollama', desc: 'Local LLM server (Llama 3, Mistral, etc.) on your infrastructure.', badge: 'Free', badgeColor: 'emerald' },
          { name: 'Custom API', desc: 'Any OpenAI-compatible endpoint — self-hosted models, proxies, etc.', badge: 'Flexible', badgeColor: 'yellow' },
        ].map(({ name, desc, badge, badgeColor }) => (
          <div key={name} className="bg-[#1a1910] border border-[#262413] rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-white">{name}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : badgeColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-stone-700 text-stone-400'}`}>{badge}</span>
            </div>
            <p className="text-xs text-[#6a6c5d]">{desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-white mb-4">Discovery Endpoint</h2>
      <p className="text-xs text-[#8a886a] mb-4">List all available providers for your workspace without authentication complexity.</p>
      <DocsCodeBlock code={`curl -X GET ${PUBLIC_API_BASE}/providers \\
  -H "X-API-Key: fidscript_live_your_key_here"`} lang="bash" />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Key Management</h2>
      <p className="text-xs text-[#8a886a] mb-4">API keys are encrypted server-side using AES-256-GCM before storage. Each key has a unique IV and auth tag — key rotation does not require re-encryption of all data.</p>
      <div className="bg-[#1a1910] border border-[#262413] rounded-xl p-4 text-xs text-[#6a6c5d] space-y-2">
        <div className="flex items-center gap-2"><span className="text-yellow-400 font-mono">iv</span><span>Per-row initialization vector (unique per key)</span></div>
        <div className="flex items-center gap-2"><span className="text-yellow-400 font-mono">auth_tag</span><span>GCM authentication tag (verification on decrypt)</span></div>
        <div className="flex items-center gap-2"><span className="text-yellow-400 font-mono">key_version</span><span>Increments on key rotation (supports future master key roll)</span></div>
      </div>

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Fallback Chains</h2>
      <p className="text-xs text-[#8a886a] mb-4">Define an ordered failover chain so your chatbot stays responsive even if a provider goes down.</p>
      <DocsCodeBlock code={`{ "chain": [ { "provider": "openrouter", "model": "google/gemini-2.0-flash-free" }, { "provider": "openai", "model": "gpt-4o-mini" }, { "provider": "gemini", "model": "gemini-2.0-flash" } ] }`} lang="json" />
    </motion.div>
  );


  if (id === 'sdks') return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">SDKs &amp; direct HTTP</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        FIDScript ships an official TypeScript SDK on npm. Every endpoint accepts
        standard JSON over HTTPS — any HTTP client in any language can integrate.
        Use the SDK for the fastest setup, or hit the API directly from any service.
      </p>

      <h2 className="text-lg font-bold text-white mb-4">1. Node.js / TypeScript SDK (recommended)</h2>
      <DocsCodeBlock
        code="npm install @fidscript/sdk"
        lang="bash"
      />
      <p className="text-xs text-[#8a886a] mt-3 mb-3">Type-safe wrappers for every endpoint:</p>
      <DocsCodeBlock
        code={`import { Fidscript, FidscriptError } from '@fidscript/sdk';

const fs = new Fidscript({ apiKey: process.env.FIDSCRIPT_API_KEY! });

// Send any of the 10 message types
await fs.sends.text('my-bot', { number: '+254700000000', message: 'Hello!' });
await fs.sends.media('my-bot', {
  number: '+254700000000',
  media_url: 'https://example.com/photo.jpg',
  caption: 'Look',
});

// Logged-in flow: chatbots, BYO LLM
const { client } = await fs.auth.requestCode('me@example.com').then(() =>
  fs.auth.verifyCode('me@example.com', '123456'),
);
await fs.instances.list();
await fs.chatbots.create({ instance_id: 'inst_abc', name: 'support-bot' });
await fs.llm.create({
  provider: 'openai',
  model: 'gpt-4o-mini',
  api_key: process.env.OPENAI_API_KEY!,
  is_default: true,
});

// Hit anything else via the generic escape hatch
await fs.api('POST', '/api/v1/groups/create', {
  subject: 'My group',
  participants: ['+254712345678'],
});

// Errors are typed
try { await fs.sends.text('bad', { number: '+254700000000', message: 'hi' }); }
catch (err) {
  if (err instanceof FidscriptError) {
    console.error(\`\${err.code} (\${err.status}): \${err.message}\`);
  }
}`}
        lang="typescript"
      />

      <h2 className="text-lg font-bold text-white mt-10 mb-4">2. Direct HTTP (any language)</h2>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">cURL</p>
          <DocsCodeBlock code={`curl -X POST https://whatsapp.fidscript.com/api/v1/messages/text/my-bot \\
  -H "X-API-Key: $FIDSCRIPT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"number":"+254700000000","text":"Hello!"}'`} lang="bash" />
        </div>
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">Python (requests)</p>
          <DocsCodeBlock code={`import requests, os

BASE = 'https://whatsapp.fidscript.com/api/v1'
KEY  = os.environ['FIDSCRIPT_API_KEY']

r = requests.post(
    f'{BASE}/messages/text/my-bot',
    headers={'X-API-Key': KEY},
    json={'number': '+254700000000', 'message': 'Hello!'},
)
r.raise_for_status()
print(r.json())`} lang="python" />
        </div>
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">Go (net/http)</p>
          <DocsCodeBlock code={`req, _ := http.NewRequest("POST",
    "https://whatsapp.fidscript.com/api/v1/messages/text/my-bot",
    strings.NewReader(\`{"number":"+254700000000","message":"Hello!"}\`),
)
req.Header.Set("X-API-Key", os.Getenv("FIDSCRIPT_API_KEY"))
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)
fmt.Println(string(body))`} lang="go" />
        </div>
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">PHP (curl)</p>
          <DocsCodeBlock code={`<?php
$ch = curl_init('https://whatsapp.fidscript.com/api/v1/messages/text/my-bot');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'X-API-Key: ' . getenv('FIDSCRIPT_API_KEY'),
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'number'  => '+254700000000',
        'message' => 'Hello!',
    ]),
]);
echo curl_exec($ch);`} lang="php" />
        </div>
      </div>

      <h2 className="text-lg font-bold text-white mt-10 mb-4">3. Generate a typed client for any other language</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Pull the live OpenAPI spec and feed it to <code className="font-mono text-[#eab308]">openapi-generator-cli</code>.
        Works for Java/Kotlin, Swift, Rust, C#, Ruby, and dozens more:
      </p>
      <DocsCodeBlock
        code={`# Pull the spec
fidscript openapi > schema.json

# Kotlin / Android
npx --yes @openapitools/openapi-generator-cli generate \\
  -i schema.json -g kotlin -o ./fidscript-kotlin

# Swift
npx --yes @openapitools/openapi-generator-cli generate \\
  -i schema.json -g swift5 -o ./fidscript-swift

# Rust
npx --yes @openapitools/openapi-generator-cli generate \\
  -i schema.json -g rust -o ./fidscript-rust

# C#
npx --yes @openapitools/openapi-generator-cli generate \\
  -i schema.json -g csharp -o ./fidscript-csharp`}
        lang="bash"
      />
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
  const [activeTab, setActiveTab] = useState<'guides' | 'api-reference' | 'changelog'>('guides');
  const [activeSection, setActiveSection] = useState(''); // open group in sidebar
  const [selectedGuide, setSelectedGuide] = useState('quickstart');
  const [selectedEndpoint, setSelectedEndpoint] = useState<typeof DOC_GROUPS[0]['endpoints'][0] | null>(null);
  const [lang, setLang] = useState<Lang>('curl');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      <SeoHead
        title="Documentation — WhatsApp API"
        description="FIDScript WhatsApp API documentation: quick start guide, authentication, webhooks, rate limits, SDKs, and complete REST API reference with code examples in cURL, Node.js, Python, PHP, and Go."
        canonical="/docs"
        schema="docs"
        breadcrumbs={[{ name: 'Documentation', url: '/docs' }]}
      />

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
          <Link to="/changelog" className="text-xs text-[#8a886a] hover:text-white transition-colors">Changelog</Link>
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
              <p className="text-sm text-[#8a886a] mb-8">
                Every update shipped to FIDScript — new endpoints, BYO-LLM guides, CLI subcommands,
                dark-mode fixes. One entry per release.
              </p>
              <ChangelogList />
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
